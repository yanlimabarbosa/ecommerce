import type { Response } from "express"

type SetCookieProps = {
  res?: Response
  name: string
  value: string
}

export const setCookie = ({ res, name, value }: SetCookieProps) => {
  res?.cookie(name, value, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days
  })
}
