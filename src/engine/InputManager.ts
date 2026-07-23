import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export interface InputState {
  mouse: THREE.Vector2
  mouseDelta: THREE.Vector2
  keys: Set<string>
  clicked: boolean
  clickedObject: string | null
}

const inputState: InputState = {
  mouse: new THREE.Vector2(),
  mouseDelta: new THREE.Vector2(),
  keys: new Set(),
  clicked: false,
  clickedObject: null,
}

export function getInputState(): InputState {
  return inputState
}

export function InputManager() {
  const lastMouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      inputState.mouseDelta.set(
        e.clientX - lastMouse.current.x,
        e.clientY - lastMouse.current.y,
      )
      inputState.mouse.set(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1,
      )
      lastMouse.current = { x: e.clientX, y: e.clientY }
    }

    const onMouseDown = (e: MouseEvent) => {
      inputState.clicked = true
      // Check if an element with data-portal-id was clicked
      const target = e.target as HTMLElement
      const portalId = target?.closest('[data-portal-id]')?.getAttribute('data-portal-id')
      if (portalId) {
        inputState.clickedObject = portalId
      }
    }

    const onMouseUp = () => {
      inputState.clicked = false
      inputState.clickedObject = null
    }

    const onKeyDown = (e: KeyboardEvent) => {
      inputState.keys.add(e.key)
    }

    const onKeyUp = (e: KeyboardEvent) => {
      inputState.keys.delete(e.key)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  return null
}
