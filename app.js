const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "todoApplication.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const hasPriorityAndStatusProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

//API 1
app.get("/todos/", async (request, response) => {
  let getTodoQuery = "";
  const { search_q = "", priority, status } = request.query;
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodoQuery = `
     SELECT * FROM todo 
     WHERE todo LIKE '%${search_q}%'
     AND priority LIKE '${priority}'
     AND status LIKE '${status}';`;
      break;
    case hasPriorityProperty(request.query):
      getTodoQuery = `
         SELECT * FROM todo
         WHERE todo LIKE '%${search_q}%'
         AND priority LIKE '${priority}';`;
      break;
    case hasStatusProperty(request.query):
      getTodoQuery = `
         SELECT * FROM todo
         WHERE todo LIKE '%${search_q}%'
         AND status LIKE '${status}';`;
      break;
    default:
      getTodoQuery = `
         SELECT * FROM todo
         WHERE todo LIKE '%${search_q}%';`;
  }
  const data = await database.all(getTodoQuery);
  response.send(data);
});

// API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoIdQuery = ` SELECT * FROM todo 
    WHERE id=${todoId};`;
  const getTodoId = await database.get(getTodoIdQuery);
  response.send(getTodoId);
});

// API 3

app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const CreateTodoQuery = `
   INSERT INTO  todo (id,todo,priority,status)
  VALUES (${id}, '${todo}', '${priority}', '${status}');`;
  const createTodo = await database.run(CreateTodoQuery);
  response.send("Todo Successfully Added");
});

// API 4

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  let updateColumn = "";
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
  }
  const previousTodoQ = `
    SELECT * FROM todo 
    WHERE id=${todoId};`;
  const previousTodo = await database.get(previousTodoQ);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body;

  const updateTodoQuery = `
   UPDATE todo 
   SET todo='${todo}',
   priority='${priority}',
   status='${status}'
   WHERE id=${todoId};`;
  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

// API 5

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `
    DELETE FROM  todo 
    WHERE id=${todoId};`;
  await database.run(deleteTodo);
  response.send("Todo Deleted");
});
module.exports = app;
