⚪ - todo
🟠 - in progress
🟢 - done

[ Weekend + Monday ]

* 🟠 Create, delete, custom props, cloning, unlink - finish core actions
* 🟢 Deep delete - children need to be removed from datastore
* 🟢 Undo stack needs: [cmd, cmd, [cmd, cmd, cmd], cmd] - to facilitate multi-select operations
* ⚪ Test hydration from complete example, clones, custom props, etc
* ⚪ Basic hotkeys for undo/redo
* ⚪ Undo / Redo
* ⚪ Consolidation, Refactors, Code Clean up - hide datastore internals in case backend replaced

[ Tuesday + Next Week ]

* ⚪ Begin selection references (multi-select aware tools?)
* ⚪ Begin transform operations
* ⚪ Begin parenting
* ⚪ Begin UI

[ General ]
* ⚪ Proper app startup flow
* ⚪ Detect connection/disconnection to backend

[ Notes ]
* Clone command
    - need to use object graph to clone due to flattening logic in there
    - need to then walk clone tree (may be root of many children)
        - create schemas for each node, write to datastore
        - create new graph nodes (possibly modify hydrate to take set instead of all nodes)
    - when hydrating nodes with cloneInfo, don't write cloneInfo until tree is assembled,
        then patch each node to have cloneInfo (will need to cloneInit too)
            - This avoids clone children event firingg