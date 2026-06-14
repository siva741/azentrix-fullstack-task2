import { useState, useCallback } from 'react'
import { DragDropContext } from '@hello-pangea/dnd'
import toast from 'react-hot-toast'
import Column from './Column'
import api from '../../services/api'

export default function KanbanBoard({ board, onBoardUpdate, allMembers }) {
  const [dragging, setDragging] = useState(false)

  const onDragStart = () => setDragging(true)

  const onDragEnd = useCallback(async (result) => {
    setDragging(false)
    const { destination, source } = result

    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const sourceColumn = board.columns.find(c => c.id === source.droppableId)
    const destColumn = board.columns.find(c => c.id === destination.droppableId)

    if (!sourceColumn || !destColumn) return

    // Optimistic update
    const newColumns = board.columns.map(col => ({ ...col, cards: [...col.cards] }))
    const srcCol = newColumns.find(c => c.id === source.droppableId)
    const dstCol = newColumns.find(c => c.id === destination.droppableId)

    const [movedCard] = srcCol.cards.splice(source.index, 1)
    const updatedCard = { ...movedCard, columnId: destination.droppableId, status: destination.droppableId }
    dstCol.cards.splice(destination.index, 0, updatedCard)

    onBoardUpdate(prev => ({ ...prev, columns: newColumns }))

    // Build reorder payload
    const cardsToUpdate = []
    newColumns.forEach(col => {
      col.cards.forEach((card, index) => {
        cardsToUpdate.push({ id: card.id, columnId: col.id, status: col.id, order: index })
      })
    })

    try {
      await api.patch(`/boards/${board.id}/cards/reorder`, { cards: cardsToUpdate, movedCardId: movedCard.id })
    } catch {
      toast.error('Failed to save card position')
      // Revert optimistic update by refetching
    }
  }, [board, onBoardUpdate])

  return (
    <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className={`kanban-board ${dragging ? 'is-dragging' : ''}`}>
        {board.columns.map(column => (
          <Column
            key={column.id}
            column={column}
            board={board}
            allMembers={allMembers}
            onBoardUpdate={onBoardUpdate}
          />
        ))}
      </div>
    </DragDropContext>
  )
}
