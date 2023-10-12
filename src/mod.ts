import { DependencyContainer } from "tsyringe";
import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { DatabaseServer } from "@spt-aki/servers/DatabaseServer";
import { ILogger } from "@spt-aki/models/spt/utils/ILogger";
import { LogTextColor } from "@spt-aki/models/spt/logging/LogTextColor";
import { ConfigServer } from "@spt-aki/servers/ConfigServer";
import { ConfigTypes } from "@spt-aki/models/enums/ConfigTypes";
import { ILocationConfig } from "@spt-aki/models/spt/config/ILocationConfig";
import config from "../config.json"

class Mod implements IPostDBLoadMod
{
    public postDBLoad(container: DependencyContainer): void 
    {
        // get database from server
        const databaseServer = container.resolve<DatabaseServer>("DatabaseServer");
        // Import the logger
        container.resolve<ILogger>("WinstonLogger");
        // Get all the in-memory json found in /assets/database
        const tables = databaseServer.getTables();
        // Define logger
        const logger = container.resolve<ILogger>("WinstonLogger");
        // Get config server
        const configServer = container.resolve<ConfigServer>("ConfigServer");
        // Load location configs
        const locationsConfig = configServer.getConfig<ILocationConfig>(ConfigTypes.LOCATION);

        // List of maps currently in the game
        const maps = [ 'bigmap', 'factory4_day', 'factory4_night', 'interchange', 'laboratory', 'lighthouse', 'rezervbase', 'shoreline', 'tarkovstreets', 'woods'];
        
        
        logger.logWithColor(`Setting equal item probabilities`, LogTextColor.CYAN);

        // Global looot chance modifier is default to 0.2. Cranking it to 1
        // Isn't doing anything?
        //logger.info(`${tables.globals.GlobalLootChanceModifier}`);
        //tables.globals.GlobalLootChanceModifier = 1;
        //logger.info(`${tables.globals.GlobalLootChanceModifier}`);

        // Apply locations config 
        for (const mapName in locationsConfig.looseLootMultiplier)
        {
            let mapStatic = locationsConfig.staticLootMultiplier[mapName];
            let mapLoose = locationsConfig.looseLootMultiplier[mapName];
            // logger.info(`${mapName} ${mapLoose}`);
            mapStatic *= 3;
            mapLoose *= 3;
            // logger.info(`${mapName} ${mapLoose}`);
        }

        logger.logWithColor(`Modifying Static Loot`, LogTextColor.CYAN);

        // static loot probability
        for (const crates in tables.loot.staticLoot)
        {
            const crate = tables.loot.staticLoot[crates];
            crate.itemDistribution.forEach(item => 
                item.relativeProbability = 1
            );
        }

        logger.logWithColor(`Modifying Loose Loot`, LogTextColor.CYAN);

        // set the probability of each spawnlocation to be equal. This means no more rare spawn spots.
        for (const mapName of maps)
        {
            const map = tables.locations[mapName];

            // The probability per spawnpoints is broken on LH and Interchange if this is set to 1 for some reason
            const int = "interchange";
            const lig = "lighthouse";
            if (mapName == int || mapName == lig)
            {
                logger.logWithColor(`BUGFIX: Slightly nerfing looseLoot on ${mapName}`, LogTextColor.CYAN);
                map.looseLoot.spawnpoints.forEach(spawn =>
                {
                    spawn.probability = 0.0999999999;
                }
                );
            }
            else
            {
                map.looseLoot.spawnpoints.forEach(spawn => 
                {
                    spawn.probability = 1;
                }
                );
            }
        }
        // Am I really hardcoding specific loot areas? Maybe
        const intSpawns = tables.locations.interchange.looseLoot.spawnpoints;
        for (const spotBuffs of intSpawns)
        {
            // Mall
            if ((spotBuffs.template.Position.x > -181) && (spotBuffs.template.Position.x < 95) && (spotBuffs.template.Position.y > 25) && (spotBuffs.template.Position.y < 39) && (spotBuffs.template.Position.z > -306) && (spotBuffs.template.Position.z < 196))
            {
                spotBuffs.probability = 1;
            },
            // Power
            if ((spotBuffs.template.Position.x > -220) && (spotBuffs.template.Position.x < -190) && (spotBuffs.template.Position.y > 20) && (spotBuffs.template.Position.y < 24) && (spotBuffs.template.Position.z > -364) && (spotBuffs.template.Position.z < -341))
            {
                spotBuffs.probability = 1;
            }
        }
        
        // Set probability for each item in the pool to be equal
        for (const mapName of maps)
        {
            const map = tables.locations[mapName];
            map.looseLoot.spawnpoints.forEach(spawn =>
                {
                    spawn.itemDistribution.forEach(item =>
                        item.relativeProbability = 1
                    );
                }
                );
            }
        }


    }
}

module.exports = { mod: new Mod() }