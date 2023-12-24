const express = require('express')
const path = require('path')
const dbPath = path.join(__dirname, 'todoApplication.db')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
let db = null
const initializationDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`Server Error ${e.message}`)
    process.exit(1)
  }
}
initializationDbAndServer()
const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}
app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query): //if this is true then below query is taken in the code
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}'
    AND priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`
  }

  data = await db.all(getTodosQuery)
  response.send(data)
})
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `SELECT * FROM todo WHERE id = ${todoId};`
  const data = await db.get(query)
  response.send(data)
})
app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body
  const query = `INSERT INTO todo(id,todo,priority,status)
  VALUES(${id},'${todo}','${priority}','${status}');`
  await db.run(query)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId/', async (request, response) => {
  let updateColumn = ''

  const {todoId} = request.params
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
  }
  const tableDataQuery = `SELECT * FROM todo WHERE id = ${todoId};`
  const oldData = await db.get(tableDataQuery)
  const {
    todo = oldData.todo,
    priority = oldData.priority,
    status = oldData.status,
  } = request.body
  const updateQuery = `UPDATE todo SET todo ='${todo}', priority = '${priority}',status = '${status}' WHERE id = ${todoId};`
  await db.run(updateQuery)
  response.send(`${updateColumn} Updated`)
})
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `DELETE FROM todo WHERE id = ${todoId};`
  await db.run(query)
  response.send('Todo Deleted')
})
module.exports = app
