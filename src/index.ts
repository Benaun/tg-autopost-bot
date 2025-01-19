import { Bot, session, GrammyError, HttpError } from 'grammy'
import { DateTime } from 'luxon'
import * as dotenv from 'dotenv'

import { MyContext } from './interfaces'
import { mainKeyBoard } from './keboars'
import { publishPost, schedulePost } from './assets'


dotenv.config()

const bot = new Bot<MyContext>(process.env.BOT_TOKEN!)

bot.use(
  session({
    initial: () => ({})
  })
)

bot.api.setMyCommands([
  {
    command: 'start',
    description: 'Запуск'
  },
  {
    command: 'support',
    description: 'Помощь'
  }
])

bot.command('start', async (ctx: MyContext) => {
  await ctx.reply('Добро пожаловать! Выберите действие:', {
    reply_markup: mainKeyBoard
  })
})

bot.command('support', async (ctx: MyContext) => {
  await ctx.reply('Возникла проблема? Обратитесь к [админу](https://t.me/benaun_126)', {
    parse_mode: 'MarkdownV2',
    link_preview_options: {
      is_disabled: true
    }
  })
})

bot.callbackQuery("publish", async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply('Жду фото...')
  ctx.session.step = 'publish_photo'
  return false;
});

bot.callbackQuery("schedule", async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply('Жду фото...')
  ctx.session.step = 'schedule_photo'
  return false;
});

bot.on(":photo", async (ctx: MyContext) => {
  const step = ctx.session.step
  const photo = ctx.message?.photo?.[ctx.message.photo.length - 1]
  const filedId = photo?.file_id

  if (step === 'publish_photo') {
    if (filedId) {
      ctx.session.post = { photo: filedId }
      ctx.session.step = 'publish_description'
      await ctx.reply('Описание поста')
    } else {
      await ctx.reply('Фото не отправлено, попробуй снова')
    }
  } else if (step === 'schedule_photo') {
    if (filedId) {
      ctx.session.post = { photo: filedId }
      ctx.session.step = 'schedule_description'
      await ctx.reply('Описание отложенного поста')
    } else {
      await ctx.reply('Фото не отправлено, попробуй снова')
    }
  } else {
    await ctx.reply('Пожалуйста, выберите действие через /start.');
  }
})

bot.on(":text", async (ctx: MyContext) => {
  const step = ctx.session.step

  if (step === 'publish_description' && ctx.session.post) {
    ctx.session.post.description = ctx.message?.text
    ctx.session.step = 'publishing'
    await publishPost(
      ctx,
      ctx.session.post.photo!,
      ctx.session.post.description!
    )
    ctx.session = {}
    await ctx.reply('Пост успешно опубликован!')
    await ctx.reply('Добро пожаловать! Выберите действие:', {
      reply_markup: mainKeyBoard
    })

  } else if (step === 'schedule_description' && ctx.session.post) {
    ctx.session.post.description = ctx.message?.text
    ctx.session.step = 'schedule_datetime'
    await ctx.reply('Укажите дату и время например, 30-05-2024 15:30:');

  } else if (step === 'schedule_datetime' && ctx.session.post) {
    const dateStr = ctx.message?.text?.trim()

    if (!dateStr) {
      await ctx.reply(
        'Введите дату и время...'
      )
      return
    }

    const inputFormat = 'dd-MM-yyyy HH:mm'

    const dateTime = DateTime.fromFormat(dateStr, inputFormat, { zone: 'Europe/Moscow' })

    if (!dateTime.isValid) {
      await ctx.reply(
        'Неверный формат даты и времени. Пожалуйста, используйте "ДД-MM.ГГГГ ЧЧ:ММ", например, "30-05-2024 15:30".'
      )
      return
    }

    const utcDate = dateTime.toUTC().toJSDate()

    ctx.session.post.datetime = utcDate
    ctx.session.step = undefined

    schedulePost(
      ctx,
      ctx.session.post.photo!,
      ctx.session.post.description!,
      utcDate
    )

    await ctx.reply('Пост был успешно запланирован!', {
      reply_markup: mainKeyBoard
    });

  } else {
    await ctx.reply('Пожалуйста, используйте команду /start для начала.');
  }
}
)

bot.catch((err) => {
  const ctx = err.ctx
  console.error(`Error while handling update ${ctx.update.update_id}`)
  const e = err.error

  if (e instanceof GrammyError) {
    console.error("Error in request:", e.description)
  }
  if (e instanceof HttpError) {
    console.error("Coudn't contact Telegramm:", e)
  }
  console.error("Unknown error:", e)
})

bot.start();
