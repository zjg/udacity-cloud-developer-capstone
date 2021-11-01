export interface Todo {
  todoId: string
  userId: string
  isOwned: boolean
  createdAt: string
  name: string
  dueDate: string
  done: boolean
  attachmentUrl?: string
  public: boolean
}
