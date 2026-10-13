// Shape of the session user set by setUserSession() in the auth routes
declare module '#auth-utils' {
  interface User {
    id: string
    email: string
    name: string
    avatar?: string
  }
}

export {}
