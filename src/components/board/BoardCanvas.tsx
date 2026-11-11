import {
  CONTENT_H,
  CONTENT_OFFSET_X,
  CONTENT_OFFSET_Y,
  CONTENT_W,
  VIRTUAL_H,
  VIRTUAL_W,
} from '../../board/constants'
import { boardItems } from '../../data/boardItems'
import { BoardItem } from './BoardItem'
import { WorkflowSection } from '../workflow/WorkflowSection'
import { HeroBlock } from './HeroBlock'
import { BoardLabels } from './BoardLabels'

/** The zoomable/pannable board surface: the CSS grid lives here (so it moves
 *  with the content), and the composition sits centered inside the virtual
 *  canvas at its original Figma coordinates. */
export function BoardCanvas() {
  return (
    <div className="board-canvas relative" style={{ width: VIRTUAL_W, height: VIRTUAL_H }}>
      <div
        id="board-content"
        style={{
          position: 'absolute',
          left: CONTENT_OFFSET_X,
          top: CONTENT_OFFSET_Y,
          width: CONTENT_W,
          height: CONTENT_H,
        }}
      >
        <HeroBlock />
        <BoardLabels />
        <WorkflowSection />
        {boardItems.map((item) => (
          <BoardItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  )
}
