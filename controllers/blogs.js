const blogRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

const jwt = require('jsonwebtoken')
const middleware = require('../utils/middleware')


blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 })
  response.json(blogs)
  })
  
blogRouter.post('/', middleware.userExtractor, async (request, response, next) => {
  //console.log(request)
  const body = request.body
  const user = request.user

  /*const blog = new Blog({
    title: body.title,
    author: user.name,
    url: body.url,
    user: user._id
  })*/
  body.user = user._id
  const blog = new Blog(body)
  
    if(!blog.likes){
      blog.likes = 0
    }
    if(!blog.title || !blog.url){
      response.status(400).end()
    }else{
      const savedBlog = await blog.save()
      user.blogs = user.blogs.concat(savedBlog._id)
      await user.save()
      response.status(201).json(savedBlog)
    }
  })

  blogRouter.get('/:id', async (request, response, next) => {
    console.log("id: ", request.params.id)
      const blog = await Blog.findById(request.params.id)
      if (blog) {
        response.json(blog)
      } else {
        response.status(404).end()
      }
   
  })
  
  blogRouter.delete('/:id',middleware.userExtractor, async (request, response, next) => {

    // get user requesting delete
  const user = request.user

  // find the blog of the requested id
  const blog = await Blog.findById(request.params.id)
  if (!blog) {
    response.status(404).end()
    return
  }

  if ( blog.user.toString() === user.id.toString() ){
    await Blog.findByIdAndRemove(request.params.id)
    response.status(204).end()
  }
  else{
    response.status(404).end()
  }
    
  })

  blogRouter.put('/:id', async (request, response, next) => {
    const blog = request.body
    const result = await Blog.findByIdAndUpdate(request.params.id, blog, {new: true})
    response.json(result)
})

module.exports = blogRouter
