components {
  id: "game"
  component: "/main/game.script"
}
components {
  id: "hud"
  component: "/main/hud.gui"
}
embedded_components {
  id: "zfactory"
  type: "factory"
  data: "prototype: \"/main/zombie.go\"\n"
}
embedded_components {
  id: "lfactory"
  type: "factory"
  data: "prototype: \"/main/loot.go\"\n"
}
