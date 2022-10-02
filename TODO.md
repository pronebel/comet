# Refactor

* When removing nodes, keep node in memory (possibly actual node, not just schema)
* Since new nodes will not collide its much easier to not need to do all the nodeUpdateId stuff (which may cause bugs eventually)
* Keep restore node command as its still needed to bring back node, but try to consolidate any new restore commands into a single one with nodes[]
* Keeping instances around should help