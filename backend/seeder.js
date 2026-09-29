import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/user.js';
import Restaurant from './models/restaurant.js';
import Menu from './models/menu.js';
import FoodItem from './models/foodItem.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, 'config', 'config.env') });

const imagesMap = {
  'South Indian': [
    'https://upload.wikimedia.org/wikipedia/commons/9/9f/Dosa_at_Sri_Ganesh_Bhavan.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/0/0b/Idli_Vada.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/9/92/Masala_Dosa_1.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/2/23/Rava_Dosa.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/6/69/Pesarattu.jpg'
  ],
  'North Indian': [
    'https://upload.wikimedia.org/wikipedia/commons/c/c5/Paneer_tikka_masala.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/5/54/Chicken_tikka_masala.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/f/fe/Palak_paneer.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/c/cb/Chole_Bhature.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/9/97/Butter_chicken_2.jpg'
  ],
  'Biryani': [
    'https://upload.wikimedia.org/wikipedia/commons/5/5a/Hyderabadi_Chicken_Biryani.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/c/c8/Biryani_of_Lahore.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/7/7c/Mutton_Biryani.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/4/48/Chicken_Biryani_at_Bawarchi_Restaurant.jpg'
  ],
  'Pizza': [
    'https://upload.wikimedia.org/wikipedia/commons/a/a3/Eq_it-na_pizza-margherita_sep2005_sml.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/9/90/Pizza_vegetarian.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/d/d3/Supreme_pizza.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/b/ba/Pizza_Pepperoni.jpg'
  ],
  'Burgers': [
    'https://upload.wikimedia.org/wikipedia/commons/4/47/Hamburger_%28black_bg%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/1/11/Cheeseburger.png',
    'https://upload.wikimedia.org/wikipedia/commons/0/0b/Chicken_burger.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/4/4d/Cheeseburger.jpg'
  ],
  'Chinese': [
    'https://upload.wikimedia.org/wikipedia/commons/3/36/Hakka_noodles.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/d/d7/Fried_Rice.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/7/73/Gobi_Manchurian.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/a/a3/Chicken_manchurian.jpg'
  ],
  'Desserts': [
    'https://upload.wikimedia.org/wikipedia/commons/7/75/Gulab_jamun_%28Dessert%29.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/3/31/Ice_Cream_dessert_02.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/9/9f/Rasmalai_1.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/b/bf/Chocolate_brownie.jpg'
  ],
  'Cafe': [
    'https://upload.wikimedia.org/wikipedia/commons/c/c5/Roasted_coffee_beans.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/4/45/A_small_cup_of_coffee.JPG',
    'https://upload.wikimedia.org/wikipedia/commons/4/41/Cold_coffee.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/9/9d/Cappuccino_at_Tully%27s_Coffee.jpg'
  ],
  'Restaurant': [
    'https://upload.wikimedia.org/wikipedia/commons/e/e4/Restaurant_interior.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/2/22/Restaurant_in_The_Bowery_Hotel.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/4/47/Restaurant_terrace.jpg',
    'https://upload.wikimedia.org/wikipedia/commons/0/04/Interior_of_a_restaurant.jpg'
  ]
};

const restaurantNames = {
  'South Indian': ['Namma Dosa House', 'Udupi Upahar', 'Sri Sagar', 'MTR Grand', 'Vidyarthi Bhavan Specials', 'A2B Adyar Ananda Bhavan', 'Dosa Camp', 'South Kitchen'],
  'North Indian': ['Punjab Tandoor', 'Delhi Darbar', 'Dhaba Express', 'The Great Indian Thali', 'Kapoor Kitchen', 'North Flavors', 'Punjabi Rasoi'],
  'Biryani': ['Biryani Junction', 'Meghana Foods Specials', 'Empire Nights', 'Hyderabadi Bawarchi', 'Nawab Biryani', 'Kolkata Biryani House', 'Mani Biryani'],
  'Pizza': ['Pizza District', 'The Slice Shop', 'Bangalore Pizzeria', 'Crust & Cheese', 'Ovenstory Central', 'Woodfire Pizzas'],
  'Burgers': ['The Burger Room', 'Truffles Central', 'Burger Point', 'Patty & Buns', 'Smash Burger Blr', 'Bite Me Burgers'],
  'Chinese': ['Wok Street', 'Beijing Bites Central', 'Mainland China', 'Chung Wah', 'The Noodle Bowl', 'Dragon Kitchen'],
  'Desserts': ['Corner House Ice Creams', 'Milano Gelato', 'Polar Bear Hub', 'The Bakehouse', 'Sweet Tooth', 'Dessert Heaven'],
  'Cafe': ['Third Wave Coffee Point', 'Blue Tokai Roasters', 'Hatti Kaapi Central', 'The Brew Room', 'Cafe Coffee Day Hub', 'Artisan Coffee House']
};

const dishNames = {
  'South Indian': ['Masala Dosa', 'Plain Dosa', 'Rava Dosa', 'Onion Dosa', 'Set Dosa', 'Neer Dosa', 'Idli Vada', 'Thatte Idli', 'Pongal', 'Bisi Bele Bath', 'Upma', 'Filter Coffee'],
  'North Indian': ['Paneer Butter Masala', 'Kadai Paneer', 'Palak Paneer', 'Dal Makhani', 'Chole Bhature', 'Rajma Chawal', 'Butter Chicken', 'Chicken Tikka Masala', 'Mutton Rogan Josh', 'Butter Naan', 'Garlic Naan', 'Jeera Rice'],
  'Biryani': ['Hyderabadi Chicken Biryani', 'Mutton Dum Biryani', 'Kolkata Chicken Biryani', 'Paneer Biryani', 'Egg Biryani', 'Veg Dum Biryani', 'Chicken Tikka Biryani', 'Andhra Chicken Biryani', 'Chicken Kebab'],
  'Pizza': ['Margherita Pizza', 'Farmhouse Pizza', 'Veggie Supreme', 'Paneer Tikka Pizza', 'Pepperoni Pizza', 'Chicken BBQ Pizza', 'Cheese Burst Pizza', 'Garlic Bread', 'Stuffed Garlic Bread'],
  'Burgers': ['Veggie Burger', 'Aloo Tikki Burger', 'Paneer Patty Burger', 'Classic Chicken Burger', 'Crispy Chicken Burger', 'Double Cheese Burger', 'Spicy Mutton Burger', 'French Fries', 'Cheese Fries'],
  'Chinese': ['Veg Hakka Noodles', 'Chicken Hakka Noodles', 'Veg Fried Rice', 'Egg Fried Rice', 'Gobi Manchurian', 'Chicken Manchurian', 'Chilli Chicken', 'Chilli Paneer', 'Veg Spring Rolls', 'Sweet Corn Soup'],
  'Desserts': ['Gulab Jamun', 'Rasmalai', 'Chocolate Brownie', 'Vanilla Ice Cream', 'Death by Chocolate', 'Red Velvet Cake', 'Tiramisu', 'Cheesecake', 'Fruit Salad'],
  'Cafe': ['Cappuccino', 'Latte', 'Espresso', 'Americano', 'Cold Coffee', 'Mocha', 'Hot Chocolate', 'Green Tea', 'Masala Chai', 'Blueberry Muffin', 'Chocolate Chip Cookie']
};

const areas = [
  'Koramangala', 'Indiranagar', 'HSR Layout', 'BTM Layout', 'JP Nagar', 
  'Jayanagar', 'Whitefield', 'Marathahalli', 'Bellandur', 'Electronic City', 
  'MG Road', 'Malleshwaram', 'Rajajinagar', 'Hebbal', 'Kalyan Nagar', 
  'Banashankari', 'Yelahanka'
];

const cuisines = Object.keys(restaurantNames);

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const generatePrice = () => {
  const prices = [69, 89, 99, 129, 149, 179, 199, 249, 299, 349];
  return prices[Math.floor(Math.random() * prices.length)];
};

const reviewPool = [
  { name: 'Aarav', rating: 5, Comment: 'Amazing food, hot and fresh, and delivery was quick.' },
  { name: 'Diya', rating: 4, Comment: 'Tasty portions and good value, packaging could be better.' },
  { name: 'Rohan', rating: 3, Comment: 'Food was good but delivery took longer than expected.' },
  { name: 'Meera', rating: 5, Comment: 'Loved the flavors, will definitely order again.' },
  { name: 'Kabir', rating: 2, Comment: 'Order arrived cold and the portion was small.' },
  { name: 'Sana', rating: 4, Comment: 'Great taste and generous quantity, a bit pricey.' },
  { name: 'Vikram', rating: 5, Comment: 'Best food in the area, spicy and well cooked.' },
  { name: 'Isha', rating: 3, Comment: 'Decent food, service was average.' },
  { name: 'Kavan', rating: 1, Comment: 'Not fresh, service was average.' },
];

const runSeeder = async () => {
  try {
    await mongoose.connect(process.env.DB_URI);
    console.log('MongoDB Connected');

    const isReset = process.argv.includes('--reset');

    console.log('Cleaning up existing test accounts...');
    const testUsers = await User.find({ email: /testrest/i });
    const userIds = testUsers.map(u => u._id);

    if (userIds.length > 0) {
      const testRestaurants = await Restaurant.find({ owner: { $in: userIds } });
      const restaurantIds = testRestaurants.map(r => r._id);

      await FoodItem.deleteMany({ restaurant: { $in: restaurantIds } });
      await Menu.deleteMany({ restaurant: { $in: restaurantIds } });
      await Restaurant.deleteMany({ owner: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });
    }
    console.log(`Cleanup complete. Deleted ${testUsers.length} test users and related records.`);

    if (isReset) {
      process.exit();
    }

    console.log('Starting seed generation with diverse data...');
    let usersCreated = 0;
    let restaurantsCreated = 0;
    let menusCreated = 0;
    let foodItemsCreated = 0;
    
    const usedRestNames = new Set();

    for (let i = 1; i <= 30; i++) {
      const user = new User({
        name: `Snackr Partner ${i}`,
        email: `testrest${i}@test.com`,
        password: `testrest${i}`,
        passwordConfirm: `testrest${i}`,
        phoneNumber: `98765432${i.toString().padStart(2, '0')}`,
        role: 'restaurant'
      });
      await user.save();
      usersCreated++;

      const area = getRandomItem(areas);
      const cuisine = getRandomItem(cuisines);
      
      let restNameBase = getRandomItem(restaurantNames[cuisine]);
      let attempts = 0;
      while (usedRestNames.has(`${restNameBase} ${area}`) && attempts < 10) {
        restNameBase = getRandomItem(restaurantNames[cuisine]);
        attempts++;
      }
      const restName = `${restNameBase} ${area}`;
      usedRestNames.add(restName);

      const reviews = [...reviewPool].sort(() => Math.random() - 0.5).slice(0, 4);

      const restaurant = new Restaurant({
        name: restName,
        owner: user._id,
        cuisine: cuisine,
        address: `123 Main St, ${area}, Bangalore`,
        reviews,
        numOfReviews: reviews.length,
        ratings: (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1),
        images: [{ public_id: `rest_${i}`, url: getRandomItem(imagesMap['Restaurant']) }]
      });
      await restaurant.save();
      restaurantsCreated++;

      // Update the user with their newly created restaurantId
      user.restaurantId = restaurant._id;
      await user.save({ validateBeforeSave: false });

      const menu = new Menu({
        restaurant: restaurant._id,
        menu: [
          { category: 'Starters', items: [] },
          { category: 'Main Course', items: [] },
          { category: 'Breads', items: [] },
          { category: 'Rice & Biryani', items: [] },
          { category: 'Desserts', items: [] },
          { category: 'Beverages', items: [] }
        ]
      });
      await menu.save();
      menusCreated++;

      const numItems = Math.floor(Math.random() * (16 - 10 + 1)) + 10;
      let availableDishes = [...dishNames[cuisine]];
      
      for (let j = 0; j < numItems; j++) {
        if (availableDishes.length === 0) availableDishes = [...dishNames[cuisine]]; 
        const dishIndex = Math.floor(Math.random() * availableDishes.length);
        const dishName = availableDishes.splice(dishIndex, 1)[0];
        
        const categoryIndex = j % 6;
        const food = new FoodItem({
          name: dishName,
          price: generatePrice(),
          description: `Authentic ${dishName} prepared fresh and served hot.`,
          category: menu.menu[categoryIndex].category,
          restaurant: restaurant._id,
          menu: menu._id,
          stock: 50,
          spiceLevel: ['No Spice', 'Mild', 'Medium', 'Spicy'][Math.floor(Math.random() * 4)],
          images: [{ public_id: `food_${i}_${j}`, url: getRandomItem(imagesMap[cuisine]) }]
        });
        await food.save();
        
        menu.menu[categoryIndex].items.push(food._id);
        foodItemsCreated++;
      }
      await menu.save();
    }

    console.log(`
Generation Complete!
Users created: ${usersCreated}
Restaurants created: ${restaurantsCreated}
Menus created: ${menusCreated}
Food items created: ${foodItemsCreated}
`);
    process.exit();
  } catch (error) {
    console.error('Seeder Error:', error);
    process.exit(1);
  }
};

runSeeder();