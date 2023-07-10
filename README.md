# Modpack
Modpack is a command line tool for managing collections of minecraft mods. I made it just for myself so if I haven't run
into a feature I need, it's not here. It uses modrinth to find and download mods.

Features I haven't added:
Smart replacement of mods (don't replace mods with the same version, don't replace mods added manually, etc.)
Version forcing (For mods that say they only work with a specific game version but may work with later versions)
Testing forge at all

To install:
```
npm install
npm run build
npm link
```

I haven't bothered publishing it npm

To use:
```
modpack create  # create a modpack
modpack add     # add mods to a modpack
modpack install # install the mods in your mods directory
modpack upgrade # change the version of the modpack (and the mods inside)
modpack help
```
