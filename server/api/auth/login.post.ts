import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, password } = body

  if (!username || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Username and password are required',
    })
  }

  const user = await prisma.staff.findUnique({
    where: { username },
  })

  if (!user || user.status !== 'Active') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid username or password',
    })
  }

  const isPasswordValid = await bcrypt.compare(password, user.password)

  if (!isPasswordValid) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid username or password',
    })
  }

  // In a real app, you would generate a JWT or session here
  // For this prototype, we'll return the user info
  return {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
  }
})
