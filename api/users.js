'use strict'

const randomInt = (min, max) => Math.floor(min + Math.random() * (max + 1 - min))

const list = [
  {
    name: 'Mr. Arch',
    role: 'admin',
    email: 'arch@example.com',
    isActive: true
  },
  {
    name: 'Manager',
    role: 'manager',
    email: 'manager@example.com',
    isActive: false
  },
  {
    name: 'Guest',
    role: 'guest',
    email: 'guest@example.com',
    isActive: true
  }
]

const item = () => {
  const { name, role, email, isActive } = list[randomInt(0, 2)]
  return {
    name: `${name}`,
    role: `${role}`,
    email: `${email}`,
    isActive: `${isActive}`
  }
}

const users = async () => {
  return Array.from({ length: 500 }, () => item())
}

module.exports = users
