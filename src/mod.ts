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
            // Kiba
            if ((spotBuffs.template.Position.x > -25) && (spotBuffs.template.Position.x < -10) && (spotBuffs.template.Position.y > 25) && (spotBuffs.template.Position.y < 29) && (spotBuffs.template.Position.z > -41) && (spotBuffs.template.Position.z < -14))
            {
                spotBuffs.probability = 1;
            },
            // Rasmussen
            if ((spotBuffs.template.Position.x > 4) && (spotBuffs.template.Position.x < 35) && (spotBuffs.template.Position.y > 25) && (spotBuffs.template.Position.y < 29) && (spotBuffs.template.Position.z > 19) && (spotBuffs.template.Position.z < 33))
            {
                spotBuffs.probability = 1;
            },
            // Texho
            if ((spotBuffs.template.Position.x > 47) && (spotBuffs.template.Position.x < 77) && (spotBuffs.template.Position.y > 25) && (spotBuffs.template.Position.y < 29) && (spotBuffs.template.Position.z > 41) && (spotBuffs.template.Position.z < 52))
            {
                spotBuffs.probability = 1;
            },
            // Techlight
            if ((spotBuffs.template.Position.x > 81) && (spotBuffs.template.Position.x < 99) && (spotBuffs.template.Position.y > 34) && (spotBuffs.template.Position.y < 39) && (spotBuffs.template.Position.z > 32) && (spotBuffs.template.Position.z < 68))
            {
                spotBuffs.probability = 1;
            },
            // Goshan Lockers
            if ((spotBuffs.template.Position.x > -73) && (spotBuffs.template.Position.x < -65) && (spotBuffs.template.Position.y > 25) && (spotBuffs.template.Position.y < 29) && (spotBuffs.template.Position.z > -4) && (spotBuffs.template.Position.z < 11))
            {
            spotBuffs.probability = 1;
            },
            // German
            if ((spotBuffs.template.Position.x > -22) && (spotBuffs.template.Position.x < -8) && (spotBuffs.template.Position.y > 25) && (spotBuffs.template.Position.y < 29) && (spotBuffs.template.Position.z > -81) && (spotBuffs.template.Position.z < 66))
            {
            spotBuffs.probability = 1;
            },
            // Emercom
            if ((spotBuffs.template.Position.x > 2) && (spotBuffs.template.Position.x < 35) && (spotBuffs.template.Position.y > 25) && (spotBuffs.template.Position.y < 29) && (spotBuffs.template.Position.z > -114) && (spotBuffs.template.Position.z < -98))
            {
            spotBuffs.probability = 1;
            },
            // UltraMed
            if ((spotBuffs.template.Position.x > 63) && (spotBuffs.template.Position.x < 78) && (spotBuffs.template.Position.y > 34) && (spotBuffs.template.Position.y < 39) && (spotBuffs.template.Position.z > 38) && (spotBuffs.template.Position.z < 51))
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