import {
  Account,
  Transaction,
  CategoryItem,
  Note,
  FollowUp,
  WishlistItem,
  Loan,
  AppSettings,
} from '../types';

export const CURRENT_DATA_VERSION = 'v2.7-updated-1793102400000';

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  displayCurrency: 'SAR',
  exchangeRateSARtoINR: 25.7,
  enableExchangeRate: true,
  enableHaptics: true,
  isFullscreen: false,
  cloudRelayUrl: 'https://ais-dev-cwlafjekfgwqw2oocm252g-132080948487.europe-west2.run.app',
  brandingLabel: 'Personal Hub',
};

export const INITIAL_CATEGORIES: CategoryItem[] = [
  {
    "id": "cat-car",
    "name": "Car",
    "color": "#3b82f6",
    "icon": "CarFront",
    "subCategories": [
      {
        "id": "sub-car-fuel",
        "categoryId": "cat-car",
        "name": "Fuel"
      },
      {
        "id": "sub-car-maint",
        "categoryId": "cat-car",
        "name": "Maintenance"
      },
      {
        "id": "sub-car-clean",
        "categoryId": "cat-car",
        "name": "Cleaning"
      },
      {
        "id": "sub-car-acc",
        "categoryId": "cat-car",
        "name": "Accessories"
      }
    ]
  },
  {
    "id": "cat-food",
    "name": "Food",
    "color": "#f59e0b",
    "icon": "UtensilsCrossed",
    "subCategories": [
      {
        "id": "sub-food-groc",
        "categoryId": "cat-food",
        "name": "Groceries"
      },
      {
        "id": "sub-food-dine",
        "categoryId": "cat-food",
        "name": "Dining"
      },
      {
        "id": "sub-food-snack",
        "categoryId": "cat-food",
        "name": "Coffee & Snacks"
      }
    ]
  },
  {
    "id": "cat-fuel",
    "name": "Fuel",
    "color": "#ef4444",
    "icon": "Fuel",
    "subCategories": []
  },
  {
    "id": "cat-shopping",
    "name": "Shopping",
    "color": "#ec4899",
    "icon": "ShoppingBag",
    "subCategories": [
      {
        "id": "sub-shop-elec",
        "categoryId": "cat-shopping",
        "name": "Electronics"
      },
      {
        "id": "sub-shop-cloth",
        "categoryId": "cat-shopping",
        "name": "Clothing"
      },
      {
        "id": "sub-shop-acc",
        "categoryId": "cat-shopping",
        "name": "Accessories"
      }
    ]
  },
  {
    "id": "cat-bills",
    "name": "Bills",
    "color": "#6366f1",
    "icon": "Receipt",
    "subCategories": [
      {
        "id": "sub-bill-mobile",
        "categoryId": "cat-bills",
        "name": "Mobile Recharge"
      },
      {
        "id": "sub-bill-utilities",
        "categoryId": "cat-bills",
        "name": "Utilities"
      }
    ]
  },
  {
    "id": "cat-family",
    "name": "Family",
    "color": "#14b8a6",
    "icon": "Heart",
    "subCategories": [
      {
        "id": "sub-fam-home",
        "categoryId": "cat-family",
        "name": "Home"
      },
      {
        "id": "sub-fam-sadaqa",
        "categoryId": "cat-family",
        "name": "Sadaqa"
      }
    ]
  },
  {
    "id": "cat-personal",
    "name": "Personal",
    "color": "#8b5cf6",
    "icon": "Fingerprint",
    "subCategories": [
      {
        "id": "sub-per-rent",
        "categoryId": "cat-personal",
        "name": "Rent & Living"
      },
      {
        "id": "sub-per-health",
        "categoryId": "cat-personal",
        "name": "Health & Medicine"
      },
      {
        "id": "sub-per-invest",
        "categoryId": "cat-personal",
        "name": "Investment"
      }
    ]
  },
  {
    "id": "cat-other",
    "name": "Other",
    "color": "#64748b",
    "icon": "Tag",
    "subCategories": []
  }
];

export const INITIAL_ACCOUNTS: Account[] = [
  {
    "id": "acc-1",
    "name": "SNB",
    "type": "bank",
    "openingBalanceSAR": 0,
    "currentBalanceSAR": -738.03,
    "color": "#8b5cf6",
    "accountNumberMask": "•••• SNB",
    "updatedAt": "2026-10-27T11:46:25.149Z"
  },
  {
    "id": "acc-2",
    "name": "D360",
    "type": "wallet",
    "openingBalanceSAR": 0,
    "currentBalanceSAR": 0,
    "color": "#06b6d4",
    "accountNumberMask": "D360",
    "updatedAt": "2026-10-27T11:46:25.149Z"
  },
  {
    "id": "acc-3",
    "name": "STC",
    "type": "wallet",
    "openingBalanceSAR": 0,
    "currentBalanceSAR": 933,
    "color": "#10b981",
    "accountNumberMask": "STC",
    "updatedAt": "2026-10-27T11:46:25.149Z"
  },
  {
    "id": "acc_1790855039108",
    "name": "Alinma",
    "type": "bank",
    "openingBalanceSAR": 0,
    "currentBalanceSAR": 355.25,
    "color": "#8b5cf6",
    "accountNumberMask": "Alinma",
    "updatedAt": "2026-10-27T11:46:25.150Z"
  },
  {
    "id": "acc_1790951200102",
    "name": "Tiqmo",
    "type": "wallet",
    "openingBalanceSAR": 0,
    "currentBalanceSAR": -5.37,
    "color": "#64748b",
    "accountNumberMask": "Tiqmo",
    "updatedAt": "2026-10-27T11:46:25.150Z"
  },
  {
    "id": "acc_1791355409897",
    "name": "CASH",
    "type": "cash",
    "openingBalanceSAR": 0,
    "currentBalanceSAR": 3.5,
    "color": "#10b981",
    "accountNumberMask": "CASH",
    "updatedAt": "2026-10-27T11:46:25.150Z"
  },
  {
    "id": "acc_1791497983529",
    "name": "Rozzy",
    "type": "wallet",
    "openingBalanceSAR": 0,
    "currentBalanceSAR": 127.5,
    "color": "#06b6d4",
    "accountNumberMask": "Rozzy",
    "updatedAt": "2026-10-27T11:46:25.150Z"
  },
  {
    "id": "acc_1791498669839",
    "name": "Isalesawab",
    "type": "savings",
    "openingBalanceSAR": 0,
    "currentBalanceSAR": 72.5,
    "color": "#3b82f6",
    "accountNumberMask": "Isalesawab",
    "updatedAt": "2026-10-27T11:46:25.150Z"
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    "id": "tx_1793090629318_c9bt",
    "type": "expense",
    "amountSAR": 149,
    "accountId": "acc_1790951200102",
    "category": "Personal",
    "date": "2026-10-27",
    "note": "Gym fees",
    "createdAt": "2026-10-27T08:43:49.318Z"
  },
  {
    "id": "tx_1793045941416_c5sc",
    "type": "expense",
    "amountSAR": 9,
    "accountId": "acc_1791497983529",
    "category": "Food",
    "subCategory": "Groceries",
    "date": "2026-10-26",
    "note": "Vegetable",
    "createdAt": "2026-10-26T20:19:01.416Z"
  },
  {
    "id": "tx_1793045847766_9853",
    "type": "expense",
    "amountSAR": 39,
    "accountId": "acc-1",
    "category": "Bills",
    "subCategory": "Utilities",
    "date": "2026-10-26",
    "note": "Cylinder refill",
    "createdAt": "2026-10-26T20:17:27.766Z"
  },
  {
    "id": "tx_1792862438789_u8lr",
    "type": "expense",
    "amountSAR": 28,
    "accountId": "acc-1",
    "category": "Food",
    "date": "2026-10-24",
    "note": "Food",
    "createdAt": "2026-10-24T17:20:38.789Z"
  },
  {
    "id": "tx_1793091303751_moxm",
    "type": "expense",
    "amountSAR": 25,
    "accountId": "acc_1791498669839",
    "category": "Other",
    "date": "2026-10-23",
    "note": "Issalesawab",
    "createdAt": "2026-10-27T08:55:03.751Z"
  },
  {
    "id": "tx_1792773769295_no7r",
    "type": "expense",
    "amountSAR": 64,
    "accountId": "acc-1",
    "category": "Food",
    "date": "2026-10-23",
    "note": "Food",
    "createdAt": "2026-10-23T16:42:49.295Z"
  },
  {
    "id": "tx_1792773722717_qqu7",
    "type": "expense",
    "amountSAR": 94,
    "accountId": "acc-1",
    "category": "Food",
    "date": "2026-10-23",
    "note": "Umrah Food Juice Milk",
    "createdAt": "2026-10-23T16:42:02.717Z"
  },
  {
    "id": "tx_1792619877026_56k5",
    "type": "expense",
    "amountSAR": 134.5,
    "accountId": "acc-1",
    "category": "Personal",
    "subCategory": "Rent & Living",
    "date": "2026-10-21",
    "note": "Visit visa Extension",
    "createdAt": "2026-10-21T21:57:57.026Z"
  },
  {
    "id": "tx_1792619808782_20ld",
    "type": "expense",
    "amountSAR": 4,
    "accountId": "acc-1",
    "category": "Food",
    "date": "2026-10-21",
    "note": "Water refill",
    "createdAt": "2026-10-21T21:56:48.782Z"
  },
  {
    "id": "tx_1792560913014_6vzt",
    "type": "expense",
    "amountSAR": 105,
    "accountId": "acc-3",
    "category": "Car",
    "subCategory": "Fuel",
    "date": "2026-10-21",
    "note": "Car Fuel Refill (fuel)",
    "createdAt": "2026-10-21T05:35:13.014Z"
  },
  {
    "id": "tx_1792528882347_x14z",
    "type": "expense",
    "amountSAR": 51,
    "accountId": "acc_1791497983529",
    "category": "Food",
    "subCategory": "Groceries",
    "date": "2026-10-20",
    "note": "Rice yoghurts",
    "createdAt": "2026-10-20T20:41:22.347Z"
  },
  {
    "id": "tx_1792441853260_ntij",
    "type": "expense",
    "amountSAR": 93,
    "accountId": "acc_1791497983529",
    "category": "Food",
    "subCategory": "Investment",
    "date": "2026-10-19",
    "note": "Vegetables",
    "createdAt": "2026-10-19T20:30:53.260Z"
  },
  {
    "id": "tx_1792441640196_4gse",
    "type": "expense",
    "amountSAR": 71.7,
    "accountId": "acc-1",
    "category": "Food",
    "date": "2026-10-19",
    "note": "Multivitamin",
    "createdAt": "2026-10-19T20:27:20.196Z"
  },
  {
    "type": "transfer",
    "amountSAR": 75,
    "category": "Shopping",
    "accountId": "acc_1790855039108",
    "toAccountId": "acc_1790951200102",
    "note": "FOR ALI EXPRESS ORDER",
    "date": "2026-10-18",
    "id": "tx_1793101433731_bzba",
    "createdAt": "2026-10-27T11:43:53.731Z"
  },
  {
    "id": "tx_1792561341411_qqvh",
    "type": "expense",
    "amountSAR": 81.37,
    "accountId": "acc_1790951200102",
    "category": "Shopping",
    "subCategory": "Home improvement",
    "date": "2026-10-18",
    "note": "Aliexpress order",
    "createdAt": "2026-10-21T05:42:21.411Z"
  },
  {
    "id": "tx_1792328906078_s9ri",
    "type": "expense",
    "amountSAR": 5,
    "accountId": "acc_1790855039108",
    "category": "Food",
    "subCategory": "Coffee & Snacks",
    "date": "2026-10-16",
    "note": "Coffee",
    "createdAt": "2026-10-18T13:08:26.078Z"
  },
  {
    "id": "tx_1792328879699_lum2",
    "type": "expense",
    "amountSAR": 265.98,
    "accountId": "acc-1",
    "category": "Food",
    "subCategory": "Groceries",
    "date": "2026-10-16",
    "note": "Juicer, lulu groceries",
    "createdAt": "2026-10-18T13:07:59.699Z"
  },
  {
    "id": "tx_1792328679472_4d6v",
    "type": "expense",
    "amountSAR": 24,
    "accountId": "acc-1",
    "category": "Food",
    "date": "2026-10-16",
    "note": "Bhukhari rice, Rita",
    "createdAt": "2026-10-18T13:04:39.472Z"
  },
  {
    "id": "tx_1792328631991_jarl",
    "type": "expense",
    "amountSAR": 11,
    "accountId": "acc-1",
    "category": "Food",
    "date": "2026-10-15",
    "note": "Juice",
    "createdAt": "2026-10-18T13:03:51.991Z"
  },
  {
    "id": "tx_1792046864468_0ntj",
    "type": "expense",
    "amountSAR": 4,
    "accountId": "acc-1",
    "category": "Food",
    "subCategory": "Groceries",
    "date": "2026-10-14",
    "note": "Water refill",
    "createdAt": "2026-10-15T06:47:44.468Z"
  },
  {
    "id": "tx_1792046973707_pngu",
    "type": "expense",
    "amountSAR": 10,
    "accountId": "acc_1791355409897",
    "category": "Food",
    "subCategory": "Coffee & Snacks",
    "date": "2026-10-13",
    "note": "Juice",
    "createdAt": "2026-10-15T06:49:33.707Z"
  },
  {
    "id": "tx_1791922105975_fiiv",
    "type": "expense",
    "amountSAR": 78,
    "accountId": "acc-1",
    "category": "Food",
    "subCategory": "Groceries",
    "date": "2026-10-13",
    "note": "Mutton",
    "createdAt": "2026-10-13T20:08:25.975Z"
  },
  {
    "id": "tx_1792046831363_1twy",
    "type": "expense",
    "amountSAR": 23.45,
    "accountId": "acc-1",
    "category": "Personal",
    "subCategory": "Health & Medicine",
    "date": "2026-10-12",
    "note": "Medicine",
    "createdAt": "2026-10-15T06:47:11.363Z"
  },
  {
    "id": "tx_1791816514337_yom3",
    "type": "expense",
    "amountSAR": 94.75,
    "accountId": "acc_1790855039108",
    "category": "Bills",
    "subCategory": "Mobile Recharge",
    "date": "2026-10-11",
    "note": "Recharge STC",
    "createdAt": "2026-10-12T14:48:34.337Z"
  },
  {
    "id": "tx_1791815477939_me4n",
    "type": "expense",
    "amountSAR": 169.5,
    "accountId": "acc_1791497983529",
    "category": "Shopping",
    "subCategory": "Electronics",
    "date": "2026-10-11",
    "note": "Lulu grocery and acer keyboard mouse",
    "createdAt": "2026-10-12T14:31:17.939Z"
  },
  {
    "id": "tx_1791580690304_lmt2",
    "type": "expense",
    "amountSAR": 103,
    "accountId": "acc-3",
    "category": "Car",
    "subCategory": "Fuel",
    "date": "2026-10-09",
    "note": "Fuel",
    "createdAt": "2026-10-09T21:18:10.304Z"
  },
  {
    "id": "tx_1791579367910_35lp",
    "type": "transfer",
    "amountSAR": 42.5,
    "accountId": "acc-1",
    "toAccountId": "acc_1791355409897",
    "category": "Transfer",
    "date": "2026-10-09",
    "note": "Atm withdraw",
    "createdAt": "2026-10-09T20:56:07.910Z"
  },
  {
    "id": "tx_1791579175748_avho",
    "type": "expense",
    "amountSAR": 4,
    "accountId": "acc_1791355409897",
    "category": "Food",
    "subCategory": "Groceries",
    "date": "2026-10-09",
    "note": "Water refill",
    "createdAt": "2026-10-09T20:52:55.748Z"
  },
  {
    "id": "tx_1791579128510_f2y6",
    "type": "expense",
    "amountSAR": 40,
    "accountId": "acc_1791498669839",
    "category": "Family",
    "subCategory": "Sadaqa",
    "date": "2026-10-09",
    "note": "Water",
    "createdAt": "2026-10-09T20:52:08.510Z"
  },
  {
    "id": "tx_1791578825248_2wrm",
    "type": "expense",
    "amountSAR": 13.5,
    "accountId": "acc-1",
    "category": "Food",
    "subCategory": "Dining",
    "date": "2026-10-09",
    "note": "Al baik",
    "createdAt": "2026-10-09T20:47:05.248Z"
  },
  {
    "id": "tx_1791498399356_2dsq",
    "type": "expense",
    "amountSAR": 280,
    "accountId": "acc_1790855039108",
    "category": "Car",
    "subCategory": "Maintenance",
    "date": "2026-10-09",
    "note": "Battery Installation",
    "createdAt": "2026-10-08T22:26:39.356Z"
  },
  {
    "id": "tx_1791567992145_7gk3",
    "type": "expense",
    "amountSAR": 5,
    "accountId": "acc_1791355409897",
    "category": "Food",
    "subCategory": "Coffee & Snacks",
    "date": "2026-10-08",
    "note": "Papaya juice",
    "createdAt": "2026-10-09T17:46:32.145Z"
  },
  {
    "id": "tx_1791498728041_ip4c",
    "type": "transfer",
    "amountSAR": 137.5,
    "accountId": "acc-1",
    "toAccountId": "acc_1791498669839",
    "category": "Transfer",
    "date": "2026-10-08",
    "note": "Isalesawab Money",
    "createdAt": "2026-10-08T22:32:08.041Z"
  },
  {
    "id": "tx_1791498591041_jnt8",
    "type": "expense",
    "amountSAR": 4,
    "accountId": "acc_1791355409897",
    "category": "Food",
    "subCategory": "Dining",
    "date": "2026-10-08",
    "note": "Rice bhukhari",
    "createdAt": "2026-10-08T22:29:51.041Z"
  },
  {
    "id": "tx_1791498530035_dohd",
    "type": "expense",
    "amountSAR": 24.4,
    "accountId": "acc-1",
    "category": "Personal",
    "subCategory": "Health & Medicine",
    "date": "2026-10-08",
    "note": "Medicine duphalac",
    "createdAt": "2026-10-08T22:28:50.035Z"
  },
  {
    "id": "tx_1791498494025_gcvq",
    "type": "expense",
    "amountSAR": 74.75,
    "accountId": "acc-1",
    "category": "Shopping",
    "subCategory": "Groceries",
    "date": "2026-10-08",
    "note": "Khamza market",
    "createdAt": "2026-10-08T22:28:14.025Z"
  },
  {
    "id": "tx_1791498453639_60fv",
    "type": "expense",
    "amountSAR": 690,
    "accountId": "acc_1790855039108",
    "category": "Car",
    "subCategory": "Maintenance",
    "date": "2026-10-08",
    "note": "Car Insurance",
    "createdAt": "2026-10-08T22:27:33.639Z"
  },
  {
    "id": "tx_1791561201922_vmyl",
    "type": "expense",
    "amountSAR": 16,
    "accountId": "acc-1",
    "category": "Food",
    "subCategory": "Coffee & Snacks",
    "date": "2026-10-07",
    "note": "Barns coffee",
    "createdAt": "2026-10-09T15:53:21.922Z"
  },
  {
    "id": "tx_1791561183197_xv1z",
    "type": "expense",
    "amountSAR": 69,
    "accountId": "acc-1",
    "category": "Shopping",
    "subCategory": "Clothing",
    "date": "2026-10-07",
    "note": "Abaya",
    "createdAt": "2026-10-09T15:53:03.197Z"
  },
  {
    "id": "tx_1791355493264_h3w3",
    "type": "expense",
    "amountSAR": 50,
    "accountId": "acc_1791497983529",
    "category": "Car",
    "subCategory": "Cleaning",
    "date": "2026-10-07",
    "note": "Car cleaning monthly",
    "createdAt": "2026-10-07T06:44:53.264Z"
  },
  {
    "id": "tx_1791355463885_xei6",
    "type": "expense",
    "amountSAR": 1,
    "accountId": "acc_1791355409897",
    "category": "Food",
    "subCategory": "Groceries",
    "date": "2026-10-06",
    "note": "Khubz",
    "createdAt": "2026-10-07T06:44:23.885Z"
  },
  {
    "id": "tx_1791355432931_kjxv",
    "type": "expense",
    "amountSAR": 15,
    "accountId": "acc_1791355409897",
    "category": "Food",
    "subCategory": "Coffee & Snacks",
    "date": "2026-10-06",
    "note": "Juice",
    "createdAt": "2026-10-07T06:43:52.931Z"
  },
  {
    "id": "tx_1791236242826_mf40",
    "type": "expense",
    "amountSAR": 48,
    "accountId": "acc-1",
    "category": "Food",
    "subCategory": "Dining",
    "date": "2026-10-05",
    "note": "Umar visit and food",
    "createdAt": "2026-10-05T21:37:22.826Z"
  },
  {
    "id": "tx_1791204198676_0l04",
    "type": "expense",
    "amountSAR": 58,
    "accountId": "acc-1",
    "category": "Food",
    "subCategory": "Dining",
    "date": "2026-10-05",
    "note": "Umar Home",
    "createdAt": "2026-10-05T12:43:18.676Z"
  },
  {
    "id": "tx_1791189561163_im4k",
    "type": "expense",
    "amountSAR": 21.87,
    "accountId": "acc-1",
    "category": "Personal",
    "subCategory": "Accessories",
    "date": "2026-10-04",
    "note": "Hand gloves",
    "createdAt": "2026-10-05T08:39:21.163Z"
  },
  {
    "id": "tx_1791062097156_ej61",
    "type": "expense",
    "amountSAR": 73,
    "accountId": "acc-1",
    "category": "Food",
    "subCategory": "Dining",
    "date": "2026-10-04",
    "note": "1947 indian kitchen",
    "createdAt": "2026-10-03T21:14:57.156Z"
  },
  {
    "id": "tx_1791062064696_l5ir",
    "type": "expense",
    "amountSAR": 216.88,
    "accountId": "acc-1",
    "category": "Shopping",
    "subCategory": "Accessories",
    "date": "2026-10-04",
    "note": "Purse and Socks",
    "createdAt": "2026-10-03T21:14:24.696Z"
  },
  {
    "id": "tx_1790957398394_83oo",
    "type": "expense",
    "amountSAR": 2,
    "accountId": "acc-1",
    "category": "Food",
    "subCategory": "Coffee & Snacks",
    "date": "2026-10-02",
    "note": "Tea",
    "createdAt": "2026-10-02T16:09:58.394Z"
  },
  {
    "id": "tx_1790937271192_3u56",
    "type": "expense",
    "amountSAR": 31,
    "accountId": "acc-1",
    "category": "Food",
    "subCategory": "Dining",
    "date": "2026-10-02",
    "note": "Grove breakfast",
    "createdAt": "2026-10-02T10:34:31.192Z"
  },
  {
    "id": "tx_1790896790098_jqtz",
    "type": "expense",
    "amountSAR": 500,
    "accountId": "acc-1",
    "category": "Personal",
    "subCategory": "Investment",
    "date": "2026-10-01",
    "note": "Investment",
    "createdAt": "2026-10-01T23:19:50.098Z"
  },
  {
    "id": "tx_1790893437316_gitw",
    "type": "expense",
    "amountSAR": 175,
    "accountId": "acc-1",
    "category": "Shopping",
    "subCategory": "Accessories",
    "date": "2026-10-01",
    "note": "Silver Ring",
    "createdAt": "2026-10-01T22:23:57.316Z"
  },
  {
    "id": "tx_1790893412710_u87k",
    "type": "expense",
    "amountSAR": 13,
    "accountId": "acc-1",
    "category": "Food",
    "subCategory": "Dining",
    "date": "2026-10-01",
    "note": "Mall of Arabia Food",
    "createdAt": "2026-10-01T22:23:32.710Z"
  },
  {
    "id": "tx_1790893365953_jzam",
    "type": "expense",
    "amountSAR": 17.5,
    "accountId": "acc-1",
    "category": "Bills",
    "subCategory": "Mobile Recharge",
    "date": "2026-10-01",
    "note": "Mobily Recharge",
    "createdAt": "2026-10-01T22:22:45.953Z"
  },
  {
    "id": "tx_1790855565538_a5q9",
    "type": "expense",
    "amountSAR": 1057.5,
    "accountId": "acc-2",
    "category": "Family",
    "subCategory": "Home",
    "date": "2026-09-30",
    "note": "Home 800, Mummy 120, Sadaqa 137.5",
    "createdAt": "2026-10-01T11:52:45.538Z"
  },
  {
    "id": "tx_1790855511019_kxvt",
    "type": "expense",
    "amountSAR": 109,
    "accountId": "acc-3",
    "category": "Car",
    "subCategory": "Fuel",
    "date": "2026-09-30",
    "note": "Petrol",
    "createdAt": "2026-10-01T11:51:51.019Z"
  },
  {
    "id": "tx_expense_snb_vision_4905",
    "type": "expense",
    "amountSAR": 4905,
    "accountId": "acc-1",
    "category": "Personal",
    "subCategory": "Rent & Living",
    "date": "2026-09-30",
    "note": "VISION BANK",
    "createdAt": "2026-09-30T09:35:00.000Z"
  },
  {
    "id": "tx_transfer_snb_rozzy_500",
    "type": "transfer",
    "amountSAR": 500,
    "accountId": "acc-1",
    "toAccountId": "acc_1791497983529",
    "category": "Transfer",
    "date": "2026-09-30",
    "note": "Groceries (cash)",
    "createdAt": "2026-09-30T09:30:00.000Z"
  },
  {
    "id": "tx_transfer_snb_tiqmo_150",
    "type": "transfer",
    "amountSAR": 150,
    "accountId": "acc-1",
    "toAccountId": "acc_1790951200102",
    "category": "Transfer",
    "date": "2026-09-30",
    "note": "Gym fees",
    "createdAt": "2026-09-30T09:25:00.000Z"
  },
  {
    "id": "tx_transfer_snb_alinma_1500",
    "type": "transfer",
    "amountSAR": 1500,
    "accountId": "acc-1",
    "toAccountId": "acc_1790855039108",
    "category": "Transfer",
    "date": "2026-09-30",
    "note": "Car insurance and pocket money",
    "createdAt": "2026-09-30T09:20:00.000Z"
  },
  {
    "id": "tx_transfer_snb_d360_1057_5",
    "type": "transfer",
    "amountSAR": 1057.5,
    "accountId": "acc-1",
    "toAccountId": "acc-2",
    "category": "Transfer",
    "date": "2026-09-30",
    "note": "Home 800, Mummy 120, Sadaqa 137.5",
    "createdAt": "2026-09-30T09:15:00.000Z"
  },
  {
    "id": "tx_transfer_snb_stc_1250",
    "type": "transfer",
    "amountSAR": 1250,
    "accountId": "acc-1",
    "toAccountId": "acc-3",
    "category": "Transfer",
    "date": "2026-09-30",
    "note": "Petrol and Ali Express",
    "createdAt": "2026-09-30T09:10:00.000Z"
  },
  {
    "id": "tx_income_snb_11000",
    "type": "income",
    "amountSAR": 11000,
    "accountId": "acc-1",
    "category": "Personal",
    "subCategory": "Salary",
    "date": "2026-09-30",
    "note": "Income received in SNB",
    "createdAt": "2026-09-30T09:00:00.000Z"
  },
  {
    "id": "tx_1791499573771_0k85",
    "type": "expense",
    "amountSAR": 1500,
    "accountId": "acc_1791497983529",
    "category": "Car",
    "subCategory": "Maintenance",
    "date": "2026-08-18",
    "note": "Gear box Maintenance, oil change, Fuel injector",
    "createdAt": "2026-10-08T22:46:13.771Z"
  },
  {
    "id": "tx_1791499222079_y4rb",
    "type": "income",
    "amountSAR": 1500,
    "accountId": "acc_1791497983529",
    "category": "Income",
    "date": "2026-08-18",
    "note": "Added funds",
    "createdAt": "2026-10-08T22:40:22.079Z"
  }
];

export const INITIAL_FOLLOWUPS: FollowUp[] = [
  {
    "id": "task-1791576743400-tjx5",
    "title": "Car ts10 glass cover",
    "category": "Car",
    "priority": "medium",
    "dueDate": "2026-10-12",
    "notes": "Task created. (Progress: 85%)",
    "isCompleted": false,
    "createdAt": "2026-10-09T00:00:00.000Z",
    "checklist": []
  },
  {
    "id": "task-1791269374849-6j3x",
    "title": "Room change",
    "category": "Personal",
    "priority": "medium",
    "dueDate": "2026-11-15",
    "notes": "Next follow-up changed to 15 Nov 2026. (Progress: 0%)",
    "isCompleted": false,
    "createdAt": "2026-10-06T00:00:00.000Z",
    "checklist": []
  },
  {
    "id": "task-1791269353564-ppjo",
    "title": "Washing machine repair",
    "category": "Personal",
    "priority": "medium",
    "dueDate": "2026-10-27",
    "notes": "Task created. (Progress: 0%)",
    "isCompleted": true,
    "completedAt": "2026-10-27T08:42:00.527Z",
    "createdAt": "2026-10-06T00:00:00.000Z",
    "checklist": []
  },
  {
    "id": "task-1791117775412-6cqd",
    "title": "Car cleaning before installing seat cover",
    "category": "Car",
    "priority": "medium",
    "dueDate": "2026-10-07",
    "notes": "Task created. (Progress: 0%)",
    "isCompleted": false,
    "createdAt": "2026-10-04T00:00:00.000Z",
    "checklist": []
  },
  {
    "id": "task-1791049116447-3drz",
    "title": "Mudassir studies or job",
    "category": "Personal",
    "priority": "high",
    "dueDate": "2026-10-06",
    "notes": "Next follow-up rescheduled to 3 days (6 Oct 2026). (Progress: 0%)",
    "isCompleted": false,
    "createdAt": "2026-10-03T00:00:00.000Z",
    "checklist": []
  },
  {
    "id": "task-1791042236479-wv7u",
    "title": "Car accessories order Ali Express",
    "category": "Car",
    "priority": "low",
    "dueDate": "2026-10-06",
    "notes": "Task created. (Progress: 0%)",
    "isCompleted": false,
    "createdAt": "2026-10-03T00:00:00.000Z",
    "checklist": []
  },
  {
    "id": "task-1790937103392-wt1f",
    "title": "Umrah rate",
    "category": "Personal",
    "priority": "medium",
    "dueDate": "2026-10-07",
    "notes": "Progress updated to 100%. Task completed.",
    "isCompleted": true,
    "completedAt": "2026-10-10T12:25:45.324Z",
    "createdAt": "2026-10-02T00:00:00.000Z",
    "checklist": []
  },
  {
    "id": "task-1790936951887-qhcx",
    "title": "Car seat cover Quotation",
    "category": "Car",
    "priority": "medium",
    "dueDate": "2026-10-07",
    "notes": "Quotation for indian brand fabro and flooring 500\nSaudi made and flooring 550 with steering gear",
    "isCompleted": false,
    "createdAt": "2026-10-02T00:00:00.000Z",
    "checklist": []
  },
  {
    "id": "task-1790856374014-1hpo",
    "title": "Maharashtra bank FATCA",
    "category": "Finance",
    "priority": "high",
    "dueDate": "2026-10-01",
    "notes": "Send email. Marked task as Completed.",
    "isCompleted": true,
    "completedAt": "2026-10-04T08:09:44.573Z",
    "createdAt": "2026-10-01T00:00:00.000Z",
    "checklist": []
  },
  {
    "id": "task-2",
    "title": "Insurance Renew",
    "category": "Car",
    "priority": "high",
    "dueDate": "2026-10-08",
    "notes": "Car insurance renewed. Marked task as Completed.",
    "isCompleted": true,
    "completedAt": "2026-10-10T12:25:18.854Z",
    "createdAt": "2026-09-28T00:00:00.000Z",
    "checklist": []
  }
];

export const INITIAL_NOTES: Note[] = [
  {
    "id": "note_1791390008008",
    "title": "Bugs tweaks",
    "content": "Log entry not able to adit\nAi integration",
    "category": "Personal",
    "color": "lavender",
    "isPinned": false,
    "createdAt": "2026-10-07T16:20:08.008Z",
    "updatedAt": "2026-10-09T21:19:45.845Z",
    "checklist": []
  },
  {
    "id": "note_1791114700376",
    "title": "Items to buy",
    "content": "1. Booster cable \n2. Torque wrench\n3. Electric car jack\n4. Water cooler\n5. Ugreen K331 MK006 LP669 4000 DPI mouse",
    "category": "Car",
    "color": "lavender",
    "isPinned": false,
    "createdAt": "2026-10-04T11:51:40.376Z",
    "updatedAt": "2026-10-05T09:21:22.813Z",
    "checklist": []
  }
];

export const INITIAL_LOANS: Loan[] = [
  {
    "id": "loan_1790855268078_t4p",
    "counterpartyName": "Haris",
    "type": "borrowed",
    "amountSAR": 3891.05,
    "repaidAmountSAR": 0,
    "originalCurrency": "INR",
    "originalAmount": 100000,
    "dueDate": "2027-01-01",
    "notes": "For increase investment (Original: 100000 INR)",
    "status": "active",
    "createdAt": "2026-10-01T11:47:48.078Z",
    "repayments": []
  },
  {
    "id": "loan-1",
    "counterpartyName": "Shahid Mamu",
    "type": "borrowed",
    "amountSAR": 3891.05,
    "repaidAmountSAR": 0,
    "originalCurrency": "INR",
    "originalAmount": 100000,
    "dueDate": "2027-01-01",
    "notes": "Opening for Shop (Original: 100000 INR)",
    "status": "active",
    "createdAt": "2026-08-02T11:41:56.413Z",
    "repayments": []
  }
];

export const INITIAL_WISHLISTS: WishlistItem[] = [
  {
    "id": "wl_car_seat",
    "title": "Car seat cover (Indian Fabro & Flooring)",
    "estimatedPriceSAR": 500,
    "savedAmountSAR": 0,
    "priority": "high",
    "category": "Car",
    "targetDate": "2026-10-15",
    "notes": "Quotation: Indian brand Fabro and flooring 500 SAR",
    "isPurchased": false,
    "createdAt": "2026-10-02T10:29:11.887Z"
  },
  {
    "id": "wl_booster",
    "title": "Booster cable",
    "estimatedPriceSAR": 120,
    "savedAmountSAR": 0,
    "priority": "medium",
    "category": "Car",
    "targetDate": "2026-10-20",
    "notes": "From Items to buy list",
    "isPurchased": false,
    "createdAt": "2026-10-04T11:51:40.376Z"
  },
  {
    "id": "wl_torque",
    "title": "Torque wrench",
    "estimatedPriceSAR": 180,
    "savedAmountSAR": 0,
    "priority": "medium",
    "category": "Car",
    "targetDate": "2026-10-25",
    "notes": "From Items to buy list",
    "isPurchased": false,
    "createdAt": "2026-10-04T11:51:40.376Z"
  },
  {
    "id": "wl_jack",
    "title": "Electric car jack",
    "estimatedPriceSAR": 260,
    "savedAmountSAR": 0,
    "priority": "medium",
    "category": "Car",
    "targetDate": "2026-10-30",
    "notes": "From Items to buy list",
    "isPurchased": false,
    "createdAt": "2026-10-04T11:51:40.376Z"
  },
  {
    "id": "wl_mouse",
    "title": "Ugreen K331 MK006 LP669 4000 DPI mouse",
    "estimatedPriceSAR": 75,
    "savedAmountSAR": 0,
    "priority": "medium",
    "category": "Tech",
    "targetDate": "2026-10-10",
    "notes": "From Items to buy list",
    "isPurchased": false,
    "createdAt": "2026-10-04T11:51:40.376Z"
  },
  {
    "id": "wl_cooler",
    "title": "Water cooler",
    "estimatedPriceSAR": 95,
    "savedAmountSAR": 0,
    "priority": "low",
    "category": "Personal",
    "notes": "From Items to buy list",
    "isPurchased": false,
    "createdAt": "2026-10-04T11:51:40.376Z"
  }
];

export const STORAGE_KEYS = {
  SETTINGS: 'phub_settings_v2',
  ACCOUNTS: 'phub_accounts_v2',
  TRANSACTIONS: 'phub_transactions_v2',
  CATEGORIES: 'phub_categories_v2',
  NOTES: 'phub_notes_v2',
  FOLLOWUPS: 'phub_followups_v2',
  WISHLISTS: 'phub_wishlists_v2',
  LOANS: 'phub_loans_v2',
  DATA_VERSION: 'phub_data_version_v2',
  HIDE_AMOUNTS: 'phub_hide_amounts',
  GATE_STATE: 'phub_gate_state_v2',
};

export function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item);
  } catch (err) {
    console.error(`Failed to load ${key} from localStorage:`, err);
    return defaultValue;
  }
}

export function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save ${key} to localStorage:`, err);
  }
}

export function clearAllStorage(): void {
  try {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.error('Failed to clear storage:', err);
  }
}

export function parsePersonalHubJson(json: any, exchangeRate: number = 25.7) {
  if (!json) {
    return {
      accounts: [],
      transactions: [],
      categories: [],
      followups: [],
      notes: [],
      loans: [],
      wishlists: [],
      exchangeRate: 25.7,
    };
  }
  const cols = json.dataCollections || json;
  return {
    accounts: cols.accounts || [],
    transactions: cols.transactions || [],
    categories: cols.categories || [],
    followups: cols.tasks || cols.followups || [],
    notes: cols.notes || [],
    loans: cols.loans || [],
    wishlists: cols.wishlists || [],
    exchangeRate: cols.exchangeRate?.rateSarToInr || exchangeRate,
  };
}
