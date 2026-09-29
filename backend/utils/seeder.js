import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import connectDatabase from "../config/database.js";
import Fooditem from "../models/foodItem.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../config/config.env") });

connectDatabase();

const seedFooditems = async () => {
  try {
    const dataFilePath = path.join(__dirname, "../data/foodItem.json");
    if (!fs.existsSync(dataFilePath)) {
      console.log("No data/foodItem.json found. Skipping seeder.");
      process.exit(0);
    }
    const fooditems = JSON.parse(fs.readFileSync(dataFilePath, "utf-8"));
    await Fooditem.deleteMany();
    console.log("Existing FoodItems deleted.");
    await Fooditem.insertMany(fooditems);
    console.log("All sample FoodItems seeded successfully.");
    process.exit(0);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

seedFooditems();
