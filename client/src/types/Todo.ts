export interface Todo {
  todoId: string
  isOwned: boolean
  createdAt: string
  name: string
  dueDate: string
  done: boolean
  attachmentUrl?: string
  public: boolean
}
