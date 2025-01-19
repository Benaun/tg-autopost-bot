import { Context, SessionFlavor } from 'grammy'

type Post = {
  photo?: string,
  description?: string,
  datetime?: Date
}

export interface SessionData {
  step?: string,
  post?: Post,
}

export type MyContext = Context & SessionFlavor<SessionData>