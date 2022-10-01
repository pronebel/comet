[ Replicable Issues ]

    "ali:AddChild",
    "ali:AddChild",
    "mat:ModifyModel",
    "ali:RemoveChild",
    "ali:undo",
    "mat:undo",

    * Problem: Debug:1 & Debug:2 get undone by ali and get recreated as Debug:3 & Debug:4, but mat has cached references to 1&2
    * Hypotheses: Need to update cached refs with new instances, but keep them cached for restore when needed (and check that are already restored to avoid duplicate)