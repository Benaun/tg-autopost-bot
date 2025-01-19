import { MyContext } from "./interfaces"
import { parse } from "date-fns"
import { schedule } from 'node-cron'

const parseDate = (dateStr: string): Date | null => {
  const parseDate = parse(dateStr, "dd-MM-yyyy HH:mm", new Date())
  return isNaN(parseDate.getTime()) ? null : parseDate
}

const publishPost = async (ctx: MyContext, photo: string, description: string) => {
  try {
    await ctx.api.sendPhoto(
      process.env.CHANNEL_ID!,
      photo,
      {
        caption: description
      }
    )
  } catch (error) {
    console.error('Ошибка при публикации поста:', error);
    await ctx.reply('Произошла ошибка при публикации поста.');
  }
}

const getCronExpression = (date: Date): string => {
  const seconds = date.getUTCSeconds();
  const minutes = date.getUTCMinutes();
  const hours = date.getUTCHours();
  const day = date.getUTCDate();
  const month = date.getUTCMonth() + 1;

  return `${minutes} ${hours} ${day} ${month} *`;
};

const schedulePost = (
  ctx: MyContext,
  photo: string,
  description: string,
  datetime: Date
) => {
  const cronTime = getCronExpression(datetime)

  schedule(cronTime, async () => {
    try {
      await ctx.api.sendPhoto(
        process.env.CHANNEL_ID!,
        photo,
        {
          caption: description,
        },
      )
    } catch (error) {
      console.error('Ошибка при публикации поста:', error);
      await ctx.reply('Произошла ошибка при публикации поста.');
    }
  })
}

export { parseDate, publishPost, schedulePost }