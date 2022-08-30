const logger = require("./logger")
const dummy = (blogs) => {
 return 1   
}

const totalLikes = (blogs) => {
    const reducer = (sum, item) => {
        return sum+item.likes
    }
    return blogs.reduce(reducer,0)
}

const favoriteBlog = (blogs) => {

    const reducer = (favorite, item) => {
        return item.likes > favorite.likes ? item:favorite
    } 

    return blogs.reduce(reducer)
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog
}