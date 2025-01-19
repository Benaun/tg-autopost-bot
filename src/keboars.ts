import { InlineKeyboard } from 'grammy'

export const mainKeyBoard = new InlineKeyboard()
  .text('Опубликовать пост', 'publish').row()
  .text('Отложенная публикация', 'schedule')