import { TodoAccess } from '../helpers/todosAcess'
import { AttachmentUtils } from '../helpers/attachmentUtils';
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
// import * as createError from 'http-errors'

const logger = createLogger('TodoBusinessLogic')
const todoAccess = new TodoAccess()
const attachments = new AttachmentUtils()

export async function createTodo(userId: string, request: CreateTodoRequest)
    : Promise<TodoItem>
{
    // check if user exists

    logger.info(`creating todo for user ${userId}`)

    const todoItem: TodoItem = {
        userId: userId,
        todoId: uuid.v4(),
        createdAt: new Date().toISOString(),
        done: false,
        ...request
    }

    return todoAccess.createTodo(todoItem)
}

export async function getTodosForUser(userId: string)
    : Promise<TodoItem[]>
{
    // check if user exists

    logger.info(`getting all todos for user ${userId}`)

    return todoAccess.getTodosForUser(userId)
}

export async function updateTodo(userId: string, todoId: string, request: UpdateTodoRequest)
    : Promise<TodoItem>
{
    // check if user exists
    // check if todo ID exists

    const todoUpdate = request as TodoUpdate

    return todoAccess.updateTodoForUser(userId, todoId, todoUpdate)
}

export async function deleteTodo(userId: string, todoId: string)
    :Promise<TodoItem>
{
    // check if user exists
    // check if todo ID exists

    logger.info(`deleting todo ${todoId} for user ${userId}`)

    return todoAccess.deleteTodoForUser(userId, todoId)
}

export async function createAttachmentPresignedUrl(userId: string, todoId: string)
    : Promise<string>
{
    logger.info(`getting attachment URL for ${todoId} for user ${userId}`)
    const presignedUrl = await attachments.getPresignedUrl(todoId)
    const attachmentUrl = getPathFromUrl(presignedUrl)
    logger.info(`attachment URL for ${todoId}: ${attachmentUrl}`)
    await todoAccess.setAttachmentUrl(userId, todoId, attachmentUrl)
    return presignedUrl
}

// from: https://stackoverflow.com/a/2541083
function getPathFromUrl(url: string): string
{
    return url.split(/[#?]/)[0]
}