# Scratch Studio — Visual Coding Environment (React + Tailwind)

## Run
    npm i
    npm start      # http://localhost:3000

## Features
- Motion: move steps, turn degrees, go to x/y, repeat (container block)
- Looks: say / think for N seconds (bubbles on the stage)
- Drag & drop: palette -> script, reorder, nest inside repeat, drag back to palette to delete
- Multiple sprites: add/remove, each with its own script; "Play all sprites" runs them together
- Hero feature: when two sprites collide their running animations are swapped

## Structure
    src/engine.js              block specs, tree helpers, generator-based animation engine
    src/App.jsx                state, drag/drop logic, play loop, collision swap
    src/components/Blocks.jsx  Palette, BlockList, Block
    src/components/Stage.jsx   stage rendering
