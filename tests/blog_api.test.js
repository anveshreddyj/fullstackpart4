const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const api = supertest(app)
const jwt = require('jsonwebtoken')
const Blog = require('../models/blog')

const bcrypt = require('bcrypt')
const User = require('../models/user')

beforeEach(async () => {
  await Blog.deleteMany({})
  for (let blog of helper.initialBlogs) {
    let blogObject = new Blog(blog)
    await blogObject.save()
  }
})
beforeEach(async () => {
  await User.deleteMany({})

  const passwordHash = await bcrypt.hash('sekret', 10)
  const user = new User({ username: 'root', passwordHash })

  await user.save()
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('there are two blogs', async () => {
  const response = await api.get('/api/blogs')

  expect(response.body).toHaveLength(helper.initialBlogs.length)
})

test('the specific blog is about React', async () => {
  const response = await api.get('/api/blogs')

  const contents = response.body.map(r => r.title)
  expect(contents).toContain(
    'React patterns'
  )
})

test('a valid blog can be added', async () => {

  const allUsers = await helper.usersInDb()
  const user = allUsers[0]

  const userForToken = {
    username: user.username,
    id: user.id
  }
  const token = jwt.sign(userForToken, process.env.SECRET)

  const newBlog = {
    _id: "5a422b3a1b54a676234d17f9",
    title: "Canonical string reduction",
    author: "Edsger W. Dijkstra",
    url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
    likes: 12,
    __v: 0
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

    const blogsAtEnd = await helper.blogsInDb()
    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length + 1)
  
    const contents = blogsAtEnd.map(n => n.title)
   
  expect(contents).toContain(
    'Canonical string reduction'
  )
})

test('blog without title is not added', async () => {

  const allUsers = await helper.usersInDb()
  const user = allUsers[0]

  const userForToken = {
    username: user.username,
    id: user.id
  }
  const token = jwt.sign(userForToken, process.env.SECRET)

  const newBlog = {
    _id: "5a422b3a1b54a676234d17f9",
    author: "Edsger W. Dijkstra",
    url: "http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html",
    likes: 12,
    __v: 0
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `bearer ${token}`)
    .send(newBlog)
    .expect(400)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
})

test('blog without url is not added', async () => {
  
  const allUsers = await helper.usersInDb()
  const user = allUsers[0]

  const userForToken = {
    username: user.username,
    id: user.id
  }
  const token = jwt.sign(userForToken, process.env.SECRET)

  const newBlog = {
    _id: "5a422b3a1b54a676234d17f9",
    author: "Edsger W. Dijkstra",
    title: "missing url title",
    likes: 12,
    __v: 0
  }

  await api
    .post('/api/blogs')
    .set('Authorization', `bearer ${token}`)
    .send(newBlog)
    .expect(400)

    const blogsAtEnd = await helper.blogsInDb()

    expect(blogsAtEnd).toHaveLength(helper.initialBlogs.length)
})

test('a specific blog can be viewed', async () => {
  const blogsAtStart = await helper.blogsInDb()

  const blogToView = blogsAtStart[0]

  const resultBlog = await api
    .get(`/api/blogs/${blogToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const processedBlogToView = JSON.parse(JSON.stringify(blogToView))

  expect(resultBlog.body).toEqual(processedBlogToView)
})

test('a blog can be deleted', async () => {

  const allUsers = await helper.usersInDb()
  const user = allUsers[0]

  const userForToken = {
    username: user.username,
    id: user.id
  }
  const token = jwt.sign(userForToken, process.env.SECRET)

  const newBlog = {
    _id: "5a422b3a1b54a676234d17f9",
    title: "missing likes blog string reduction",
    author: "missed sharma",
    url: "missing url",
    __v: 0
  }

  const savedBlog = await api
    .post('/api/blogs')
    .set('Authorization', `bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  
  await api
    .delete(`/api/blogs/${newBlog._id}`)
    .set('Authorization', `bearer ${token}`)
    .expect(204)

  const blogsAtEnd = await helper.blogsInDb()

  expect(blogsAtEnd).toHaveLength(
    helper.initialBlogs.length
  )
  const contents = blogsAtEnd.map(r => r.title)

  expect(contents).not.toContain(savedBlog.title)
})

test ('id is the unique identifier', async ()=>{
  const blogs = await helper.blogsInDb()
  const firstBlog = blogs[0]

  expect(firstBlog.id).toBeDefined()

})

test('missing likes default to 0', async () => {

  const allUsers = await helper.usersInDb()
  const user = allUsers[0]

  const userForToken = {
    username: user.username,
    id: user.id
  }
  const token = jwt.sign(userForToken, process.env.SECRET)

  const newBlog = {
    _id: "5a422b3a1b54a676234d17f9",
    title: "missing likes blog string reduction",
    author: "missed sharma",
    url: "missing url",
    __v: 0
  }

  const savedBlog = await api
    .post('/api/blogs')
    .set('Authorization', `bearer ${token}`)
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

    const resultBlog = await api
    .get(`/api/blogs/${newBlog._id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  expect(resultBlog.body.likes).toEqual(0)

})

test('likes is getting updated', async() => {
  const blogsAtStart = await helper.blogsInDb()

  const blogToView = blogsAtStart[0]

  const resultBlog = await api
    .get(`/api/blogs/${blogToView.id}`)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  let previousLikes = resultBlog.body.likes
  resultBlog.body.likes = previousLikes+1

  const updatedBlog = await api
    .put(`/api/blogs/${blogToView.id}`)
    .send(resultBlog.body)
    //.expect(204)
    //.expect('Content-Type', /application\/json/)

  expect(updatedBlog.body.likes).toEqual(previousLikes+1)
})

describe('when there is initially one user in db', () => {
  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toHaveLength(usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    expect(usernames).toContain(newUser.username)
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    expect(result.body.error).toContain('username must be unique')

    const usersAtEnd = await helper.usersInDb()
    expect(usersAtEnd).toEqual(usersAtStart)
  })
})

describe('username password validations', () => {

  test('user creation fails when no username exists', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: '',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

      expect(result.body.error).toContain('invalid username')

      const usersAtEnd = await helper.usersInDb()
      expect(usersAtEnd).toEqual(usersAtStart)
  })

  
})


afterAll(() => {
  mongoose.connection.close()
})