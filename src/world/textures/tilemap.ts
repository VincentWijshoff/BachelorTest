export const Tilemap = new Map<string,Map<string,string>>([[
    'IceWorld', new Map<string,string>([
        ['tile', 'icetile.png'], // regular background tile
        ['wallhthin', 'icewallhthin.png'], // thin horizontal wall
        ['wallhthick', 'icewallhthick.png'], // thick horizontal wall
        ['wallv', 'icewallv.png'], // vertical wall
        ['wallclun', 'icewallclun.png'], // corner wall left-under
        ['wallclup', 'icewallclup.png'], // corner wall left-upper
        ['wallcrun', 'icewallcrun.png'], // corner wall right-under
        ['wallcrup', 'icewallcrup.png'], // corner wall right-upper
        ['fence1', 'icefence1.png'], // fence between fences
        ['fence2', 'icefence2.png'], // end of fence on the right
        ['fence3', 'icefence3.png'],  // end of fence on the left
        ['portal', 'portal.png'], // portal to lobby
        ['penguinwall', 'penguin.png'],
        ['coin', 'coin.png'],
        //beartiles
        //left
        ['bearfrontleftwalking0', 'beartiles/left/bearfrontleftwalking0.png'],
        ['bearbackleftwalking0', 'beartiles/left/bearbackleftwalking0.png'],
        ['bearfrontleftwalking1', 'beartiles/left/bearfrontleftwalking1.png'],
        ['bearbackleftwalking1', 'beartiles/left/bearbackleftwalking1.png'],
        ['bearfrontleftwalking2', 'beartiles/left/bearfrontleftwalking2.png'],
        ['bearbackleftwalking2', 'beartiles/left/bearbackleftwalking2.png'],
        ['bearfrontleftwalking3', 'beartiles/left/bearfrontleftwalking3.png'],
        ['bearbackleftwalking3', 'beartiles/left/bearbackleftwalking3.png'],
        ['bearfrontleftwalking4', 'beartiles/left/bearfrontleftwalking4.png'],
        ['bearbackleftwalking4', 'beartiles/left/bearbackleftwalking4.png'],
        ['bearfrontleftwalking5', 'beartiles/left/bearfrontleftwalking5.png'],
        ['bearbackleftwalking5', 'beartiles/left/bearbackleftwalking5.png'],
        //right
        ['bearfrontrightwalking0', 'beartiles/right/bearfrontrightwalking0.png'],
        ['bearbackrightwalking0', 'beartiles/right/bearbackrightwalking0.png'],
        ['bearfrontrightwalking1', 'beartiles/right/bearfrontrightwalking1.png'],
        ['bearbackrightwalking1', 'beartiles/right/bearbackrightwalking1.png'],
        ['bearfrontrightwalking2', 'beartiles/right/bearfrontrightwalking2.png'],
        ['bearbackrightwalking2', 'beartiles/right/bearbackrightwalking2.png'],
        ['bearfrontrightwalking3', 'beartiles/right/bearfrontrightwalking3.png'],
        ['bearbackrightwalking3', 'beartiles/right/bearbackrightwalking3.png'],
        ['bearfrontrightwalking4', 'beartiles/right/bearfrontrightwalking4.png'],
        ['bearbackrightwalking4', 'beartiles/right/bearbackrightwalking4.png'],
        ['bearfrontrightwalking5', 'beartiles/right/bearfrontrightwalking5.png'],
        ['bearbackrightwalking5', 'beartiles/right/bearbackrightwalking5.png'],

        //up
        ['bearfrontupwalking0', 'beartiles/up/bearfrontupwalking0.png'],
        ['bearbackupwalking0', 'beartiles/up/bearbackupwalking0.png'],
        ['bearfrontupwalking1', 'beartiles/up/bearfrontupwalking1.png'],
        ['bearbackupwalking1', 'beartiles/up/bearbackupwalking1.png'],
        ['bearfrontupwalking2', 'beartiles/up/bearfrontupwalking2.png'],
        ['bearbackupwalking2', 'beartiles/up/bearbackupwalking2.png'],
        ['bearfrontupwalking3', 'beartiles/up/bearfrontupwalking3.png'],
        ['bearbackupwalking3', 'beartiles/up/bearbackupwalking3.png'],
        ['bearfrontupwalking4', 'beartiles/up/bearfrontupwalking4.png'],
        ['bearbackupwalking4', 'beartiles/up/bearbackupwalking4.png'],
        ['bearfrontupwalking5', 'beartiles/up/bearfrontupwalking5.png'],
        ['bearbackupwalking5', 'beartiles/up/bearbackupwalking5.png'],
        //down
        ['bearfrontdownwalking0', 'beartiles/down/bearfrontdownwalking0.png'],
        ['bearbackdownwalking0', 'beartiles/down/bearbackdownwalking0.png'],
        ['bearfrontdownwalking1', 'beartiles/down/bearfrontdownwalking1.png'],
        ['bearbackdownwalking1', 'beartiles/down/bearbackdownwalking1.png'],
        ['bearfrontdownwalking2', 'beartiles/down/bearfrontdownwalking2.png'],
        ['bearbackdownwalking2', 'beartiles/down/bearbackdownwalking2.png'],
        ['bearfrontdownwalking3', 'beartiles/down/bearfrontdownwalking3.png'],
        ['bearbackdownwalking3', 'beartiles/down/bearbackdownwalking3.png'],
        ['bearfrontdownwalking4', 'beartiles/down/bearfrontdownwalking4.png'],
        ['bearbackdownwalking4', 'beartiles/down/bearbackdownwalking4.png'],
        ['bearfrontdownwalking5', 'beartiles/down/bearfrontdownwalking5.png'],
        ['bearbackdownwalking5', 'beartiles/down/bearbackdownwalking5.png']

    ])], 
['PsychedelicWorld', new Map<string,string>([
    // temporary -> remove aftr maze finnish
    // walls
    ['wall1', 'prplecross.jpg'],
    ['wall2', 'prplebolt.jpg'],
    ['wall3', 'prpleheart.jpg'],
    ['wall4', 'prpleup.jpg'],
    ['wall5', 'prpleright.jpg'],
    ['wall6', 'prpledown.jpg'],
    ['wall7', 'prpleleft.jpg'],
    // paths
    ['path2', 'prplepath2.jpg'],
    //portals
    ['portal', 'portal.png'],
    ['portalleft', 'prpleleftportal.jpg'],
    ['portalright', 'prplerightportal.jpg'],
    ['coin', 'coin.png'],
    ['tile', 'prplepath2.jpg']
])],
['GrassWorld', new Map<string,string>([
    ['tile', 'grasstile.png'], // regular background tile
    ['Dwatertile', 'watertile.png'],
    ['wallhthin', 'grasswallhthin.png'], // thin horizontal wall
    ['wallhthick', 'grasswallhthick.png'], // thick horizontal wall
    ['wallv', 'grasswallv.png'], // vertical wall
    ['wallclun', 'grasswallclun.png'], // corner wall left-under
    ['wallclup', 'grasswallclup.png'], // corner wall left-upper
    ['wallcrun', 'grasswallcrun.png'], // corner wall right-under
    ['wallcrup', 'grasswallcrup.png'], // corner wall right-upper
    ['fence1', 'grassfence1.png'], // fence between fences
    ['fence2', 'grassfence2.png'], // end of fence on the right
    ['fence3', 'grassfence3.png'],  // end of fence on the left
    ['portal', 'portal.png'], // portal to lobby
    ['tree1', 'tree1.png'], // tree tiles
    ['tree2', 'tree2.png'],
    ['tree3', 'tree3.png'],
    ['tree4', 'tree4.png'],
    ['tree5', 'tree5.png'],
    ['tree6', 'tree6.png'],
    ['tree7', 'tree7.png'],
    ['tree8', 'tree8.png'],
    ['tree9', 'tree9.png'],
    ['coin', 'coin.png'],
    //dock
    ['dockmiddle', 'dockmiddle.png'],
    ['dockleft', 'dockleft.png'],
    ['dockright', 'dockright.png'],
    //boat
    //right
    ['boatfront0', 'boat/boatfront0.png'],
    ['boatmiddle0', 'boat/boatmiddle0.png'],
    ['boatback0', 'boat/boatback0.png'],
    ['boatfront1', 'boat/boatfront1.png'],
    ['boatmiddle1', 'boat/boatmiddle1.png'],
    ['boatback1', 'boat/boatback1.png'],
    ['boatfront2', 'boat/boatfront2.png'],
    ['boatmiddle2', 'boat/boatmiddle2.png'],
    ['boatback2', 'boat/boatback2.png'],
    ['boatfront3', 'boat/boatfront3.png'],
    ['boatmiddle3', 'boat/boatmiddle3.png'],
    ['boatback3', 'boat/boatback3.png'],
    //left
    ['boatfrontleft0', 'boat/boatfrontleft0.png'],
    ['boatmiddleleft0', 'boat/boatmiddleleft0.png'],
    ['boatbackleft0', 'boat/boatbackleft0.png'],
    ['boatfrontleft1', 'boat/boatfrontleft1.png'],
    ['boatmiddleleft1', 'boat/boatmiddleleft1.png'],
    ['boatbackleft1', 'boat/boatbackleft1.png'],
    ['boatfrontleft2', 'boat/boatfrontleft2.png'],
    ['boatmiddleleft2', 'boat/boatmiddleleft2.png'],
    ['boatbackleft2', 'boat/boatbackleft2.png'],
    ['boatfrontleft3', 'boat/boatfrontleft3.png'],
    ['boatmiddleleft3', 'boat/boatmiddleleft3.png'],
    ['boatbackleft3', 'boat/boatbackleft3.png']
])],
['LavaWorld', new Map<string,string>([
    ['tile', 'lavatile.png'], // regular steppable tile
    ['wall', 'lavawall.png'], // regular lava tile
    ['wallD', 'lavawall.png'], // regular lava tile
    ['wallvl', 'lavawallvl.png'], // vertical left wall
    ['wallvr', 'lavawallvr.png'], // vertical lright wall
    ['wallhun', 'lavawallhun.png'], // horizontal wall under
    ['wallhup', 'lavawallhup.png'], // horizontal wall upper
    ['wallclun', 'lavawallclun.png'], // corner wall left-under
    ['wallclup', 'lavawallclup.png'], // corner wall left-upper
    ['wallcrun', 'lavawallcrun.png'], // corner wall right-under
    ['wallcrup', 'lavawallcrup.png'], // corner wall right-upper
    ['curvelun', 'lavacurvelun.png'], // curve left-under
    ['curvelup', 'lavacurvelup.png'], // curve left-upper
    ['curverun', 'lavacurverun.png'], // curve right-under
    ['curverup', 'lavacurverup.png'], // curve right-upper
    ['portal', 'portal.png'], // portal to lobby,
    ['coin', 'coin.png']
])],
['OceanWorld', new Map<string,string>([
    ['tile', 'watertile.png'], // regular background tile
    ['wallhun', 'watertilehun.png'], // horizontal wall under
    ['wallhup', 'watertilehup.png'], // horizontal wall upper
    ['wallvr1', 'watertilevr1.png'], // vertical right wall 1 
    ['wallvr2', 'watertilevr2.png'], // vertical right wall 2
    ['wallvl', 'watertilevl.png'], // vertical left wall
    ['wallclun', 'watertileclun.png'], // corner wall left-under
    ['wallclup', 'watertileclup.png'], // corner wall left-upper
    ['wallcrun', 'watertilecrun.png'], // corner wall right-under
    ['wallcrup', 'watertilecrup.png'], // corner wall right-upper
    ['curvelun', 'watercurvelun.png'], // curve left-under
    ['curvelup', 'watercurvelup.png'], // curve left-upper
    ['curverun', 'watercurverun.png'], // curve right-under
    ['curverup', 'watercurverup.png'], // curve right-upper
    ['wallportl', 'waterportall.png'], // tile left of portal
    ['wallportr', 'waterportalr.png'], // tile right of portal
    ['portal', 'portal.png'],
    ['coin', 'coin.png'] // portal to lobby
])],
['Lobby', new Map<string,string>([
    //general lobby tiles
    ['tile', 'lobbytile.png'], 
    ['conetilewall', 'lobbyconetile.png'],
    //GrassWorld tiles
    ['grasstile', 'GrassWorld/grasstile.png'], 
    ['tree1', 'GrassWorld/tree1.png'], // tree tiles
    ['tree2', 'GrassWorld/tree2.png'],
    ['tree3', 'GrassWorld/tree3.png'],
    ['tree4', 'GrassWorld/tree4.png'],
    ['tree5', 'GrassWorld/tree5.png'],
    ['tree6', 'GrassWorld/tree6.png'],
    ['tree7', 'GrassWorld/tree7.png'],
    ['tree8', 'GrassWorld/tree8.png'],
    ['tree9', 'GrassWorld/tree9.png'],
    //IceWorld tiles
    ['icetile', 'IceWorld/icetile.png'],
    //OceanWorld tiles
    ['watertile', 'WaterWorld/watertile.png'],   
    ['wallhunwater', 'WaterWorld/watertilehun.png'],
    ['wallclunwater', 'WaterWorld/watertileclun.png'],
    ['curvelup', 'WaterWorld/watercurvelup.png'],
    ['wallcrunwater', 'WaterWorld/watertilecrun.png'],
    ['wallvr1', 'WaterWorld/watertilevr1.png'],
    ['curverup', 'WaterWorld/watercurverup.png'],
    //HillsWorld tiles
    ['hillstile', 'HillsWorld/hillstile2.png'], 
    ['tile3', 'HillsWorld/hillstile3.png'],
    ['wallhup', 'HillsWorld/hillswallhup.png'], // top of wall back-side
    ['walltop', 'HillsWorld/hillswalltop.png'], // top of wall front-side
    ['wallcluntop', 'HillsWorld/hillscluntop.png'], // top part of corner wall left-under
    ['wallcruntop', 'HillsWorld/hillswallcruntop.png'], // top of corner wall right-under
    ['tilehill', 'HillsWorld/hillstile.png'], // 
    ['wallclup', 'HillsWorld/hillswallclup.png'], // corner wall left-upper
    ['wallvl', 'HillsWorld/hillswallvl.png'], // vertical left wall
    ['wallvr', 'HillsWorld/hillswallvr.png'], // vertical right wall
    ['wallclun', 'HillsWorld/hillswallclun.png'], // corner wall left-under
    ['wallcrup', 'HillsWorld/hillswallcrup.png'], // corner wall right-upper
    ['wallcrun', 'HillsWorld/hillswallcrun.png'], // corner wall right-under
    ['wall', 'HillsWorld/hillswall.png'], // standard wall
    //DesertWorld tiles
    ['deserttile', 'DesertWorld/deserttile.png'],  
    ['darktile', 'DesertWorld/desertdarktile.png'], // dark sand background tile
    ['wallhundesert', 'DesertWorld/desertwallhun.png'], // horizontal wall under
    ['wallhupdesert', 'DesertWorld/desertwallhup.png'], // horizontal wall upper   
    ['wallvrdesert', 'DesertWorld/desertwallvr.png'], // vertical right wall
    ['wallvldesert', 'DesertWorld/desertwallvl.png'], // vertical left wall
    ['wallclundesert', 'DesertWorld/desertwallclun.png'], // corner wall left-under
    ['wallclupdesert', 'DesertWorld/desertwallclup.png'], // corner wall left-upper
    ['wallcrundesert', 'DesertWorld/desertwallcrun.png'], // corner wall right-under
    ['wallcrupdesert', 'DesertWorld/desertwallcrup.png'], // corner wall right-upper
    ['darktree1', 'DesertWorld/deserttreedark1.png'], // cactus on dark sand
    ['darktree2', 'DesertWorld/deserttreedark2.png'],
    ['darktree3', 'DesertWorld/deserttreedark3.png'],
    ['darktree4', 'DesertWorld/deserttreedark4.png'],
    //LavaWorld tiles
    ['lavatile', 'LavaWorld/lavatile.png'],  
    ['wallclunlava', 'LavaWorld/lavawallclun.png'], // corner wall left-under
    ['wallcluplava', 'LavaWorld/lavawallclup.png'], // corner wall left-upper
    ['wallcrunlava', 'LavaWorld/lavawallcrun.png'], // corner wall right-under
    ['wallcruplava', 'LavaWorld/lavawallcrup.png'], // corner wall right-upper
    //CaveWorld tiles
    ['cavetile', 'CaveWorld/floor.png'],
    ['corner1', 'CaveWorld/corner1.png'], //corner
    ['corner2', 'CaveWorld/corner2.png'],
    ['corner3', 'CaveWorld/corner3.png'],
    ['corner4', 'CaveWorld/corner4.png'],
    //PsychedelicWorld tiles
    ['ps1', 'PsychedelicWorld/prplebolt.jpg'],
    ['ps2', 'PsychedelicWorld/prplecross.jpg'],
    ['ps3', 'PsychedelicWorld/prpledown.jpg'],
    ['ps4', 'PsychedelicWorld/prpleheart.jpg'],
    ['ps5', 'PsychedelicWorld/prpleleft.jpg'],
    ['ps6', 'PsychedelicWorld/prplepath2.jpg'],
    ['ps7', 'PsychedelicWorld/prpleright.jpg'],
    ['ps8', 'PsychedelicWorld/prpleup.jpg']
])],
['DesertWorld', new Map<string,string>([
    ['tile', 'deserttile.png'], // regular background tile
    ['darktile', 'desertdarktile.png'], // dark sand background tile
    ['wallhun', 'desertwallhun.png'], // horizontal wall under
    ['wallhunlight', 'desertwallhunwhite.png'], // horizontal wall under
    ['wallhup', 'desertwallhup.png'], // horizontal wall upper
    ['wallvr', 'desertwallvr.png'], // vertical right wall
    ['wallvl', 'desertwallvl.png'], // vertical left wall
    ['wallclun', 'desertwallclun.png'], // corner wall left-under
    ['wallclup', 'desertwallclup.png'], // corner wall left-upper
    ['wallcrun', 'desertwallcrun.png'], // corner wall right-under
    ['wallcrup', 'desertwallcrup.png'], // corner wall right-upper
    ['curve1', 'desertcurve1.png'], // curve 1
    ['curve2', 'desertcurve2.png'], // curve 2
    ['curve3', 'desertcurve3.png'], // curve 3
    ['curve4', 'desertcurve4.png'], // curve 4
    ['tree1D', 'deserttree1.png'], // cactus tiles
    ['tree2D', 'deserttree2.png'],
    ['tree3D', 'deserttree3.png'],
    ['tree4D', 'deserttree4.png'],
    ['darktree1', 'deserttreedark1.png'], // cactus on dark sand
    ['darktree2', 'deserttreedark2.png'],
    ['darktree3', 'deserttreedark3.png'],
    ['darktree4', 'deserttreedark4.png'],
    ['rock', 'desertrock.png'],
    ['darkrock','desertdarkrock.png'],
    ['bigrock1', 'desertbigrock1.png'],
    ['bigrock2', 'desertbigrock2.png'],
    ['bigrock3', 'desertbigrock3.png'],
    ['bigrock4', 'desertbigrock4.png'],
    ['portal', 'portal.png'],
    ['coin', 'coin.png'] // portal to lobby
])],
['HillsWorld', new Map<string,string>([
    ['tile', 'hillstile.png'], // grass
    ['tile2', 'hillstile2.png'], // rocky
    ['tile3', 'hillstile3.png'], // foot of hill
    ['tile4', 'hillstile4.png'], // flowers
    ['wall', 'hillswall.png'], // standard wall
    ['wallblocked', 'hillswallblocked.png'], // blocked entrance wall
    ['wallhup', 'hillswallhup.png'], // top of wall back-side
    ['walltop', 'hillswalltop.png'], // top of wall front-side
    ['wallvr', 'hillswallvr.png'], // vertical right wall
    ['wallvl', 'hillswallvl.png'], // vertical left wall
    ['wallclun', 'hillswallclun.png'], // corner wall left-under
    ['wallclunmid', 'hillsclunmid.png'], // mid part of corner wall left-under
    ['wallcluntop', 'hillscluntop.png'], // top part of corner wall left-under
    ['wallclup', 'hillswallclup.png'], // corner wall left-upper
    ['wallcrun', 'hillswallcrun.png'], // corner wall right-under
    ['wallcrunmid', 'hillscrunmid.png'], // mid part of corner wall right-under
    ['wallcruntop', 'hillswallcruntop.png'], // top of corner wall right-under
    ['wallcrup', 'hillswallcrup.png'], // corner wall right-upper
    ['curveleft', 'hillscurveleft.png'], // curve left
    ['curveright', 'hillscurveright.png'], // curve right
    ['curveup', 'hillscurveup.png'], // curve left-up
    ['curvedown', 'hillscurvedown.png'], // curve up-right
    ['tree1', 'hillstree1.png'], // tree tiles
    ['tree2', 'hillstree2.png'],
    ['tree3', 'hillstree3.png'],
    ['tree4', 'hillstree4.png'],
    ['watertree1', 'hillswatertree1.png'], // tree in the water
    ['watertree2', 'hillswatertree2.png'],
    ['watertree3', 'hillswatertree3.png'],
    ['watertree4', 'hillswatertree4.png'],
    ['watercave', 'watercave.png'], // water out of cave
    ['waterfallwall','hillswaterfallwall.png'], // waterfall
    ['stream', 'hillsstream.png'], // a stream
    ['water', 'hillswater.png'], // still water
    ['rock', 'hillsrock.png'], // rock
    ['bridge','hillsbridge.png'], // bridge
    ['stair', 'stairs.png'], // stairs
    ['blueD', 'hillssky.png'], // sky
    ['horizon', 'hillshorizon.png'], // horizon
    ['chest', 'hillschest.png'], // chest
    ['portal', 'portal.png'],
    ['coin', 'coin.png'] // portal to lobby
])],
['CaveWorld', new Map<string,string>([
    ['cave','cave.png'], //black cave tile
    ['tile', 'floor.png'], //dirt floor
    ['hole1', 'hole1.png'], //black hole in cave
    ['hole2', 'hole2.png'],
    ['hole3', 'hole3.png'],
    ['hole4', 'hole4.png'],
    ['hole5', 'hole5.png'],
    ['hole6', 'hole6.png'],
    ['hole7', 'hole7.png'],
    ['hole8', 'hole8.png'],
    ['hole9', 'hole9.png'],
    ['island1', 'island1.png'], //island in the water
    ['island2', 'island2.png'],
    ['island3', 'island3.png'],
    ['island4', 'island4.png'],
    ['island5', 'island5.png'],
    ['island6', 'island6.png'],
    ['island7', 'island7.png'],
    ['island8', 'island8.png'],
    ['island9', 'island9.png'],
    ['lightl1', 'lightl1.png'],// light hole in the cave 
    ['lightl2', 'lightl2.png'],
    ['lightl3', 'lightl3.png'],
    ['lightl4', 'lightl4.png'],
    ['lightl5', 'lightl5.png'],
    ['lightl6', 'lightl6.png'],
    ['lightr1', 'lightr1.png'],
    ['lightr2', 'lightr2.png'],
    ['lightr3', 'lightr3.png'],
    ['lightr4', 'lightr4.png'],
    ['lightr5', 'lightr5.png'],
    ['lightr6', 'lightr6.png'],
    ['wall1', 'wall1.png'], //horizontal thick wall
    ['wall2', 'wall2.png'],
    ['wall3', 'wall3.png'],
    ['wall4', 'wall4.png'],
    ['wall5', 'wall5.png'],
    ['wall6', 'wall6.png'],
    ['wall7', 'wall7.png'],
    ['wall8', 'wall8.png'],
    ['wall9', 'wall9.png'],
    ['wall10', 'wall10.png'],
    ['wall11', 'wall11.png'],
    ['wall12', 'wall12.png'],
    ['wallcru', 'wallcru.png'], //vertical thin wall
    ['wallclu', 'wallclu.png'],
    ['walll1', 'wall_left_1.png'],
    ['walll2', 'wall_left_2.png'],
    ['wallr1', 'wall_right_1.png'],
    ['wallr2', 'wall_right_2.png'],
    ['corner1', 'corner1.png'], //corner
    ['corner2', 'corner2.png'],
    ['corner3', 'corner3.png'],
    ['corner4', 'corner4.png'],
    ['water', 'water.png'], //full water tile
    ['portal','portal.png'],
    ['coin', 'coin.png'] //portal to lobby    
])],
]);