// app/teas/[slug]/page.tsx
// import { notFound } from "next/navigation";
// import Link from "next/link";
// import BrewingMethodNav from "@/components/BrewingMethodNav";
// import BrewingMethodSection from "@/components/BrewingMethodSection";

import { notFound } from "next/navigation";
import TeaDescription from "../components/TeaDescription";
import TeaTypeLink from "../components/TeaTypeLink";
import SteepsTable from "../components/SteepsTable";
import BrewInfo from "../components/BrewInfo";
import RowAdvertisement from "../components/Advertisement/RowAdvertisement";

// Mock tea data - in real app, this would come from API/database
const mockTeaData = {
  slug: "dragon-well",
  name: "Да Хун Пао", // "Dragon Well Longjing",
  category: "Green Tea",
  origin: "Hangzhou, China",
  description:
    "A classic Chinese green tea with chestnut aroma and smooth, vegetal flavor. Known for its flat, sword-shaped leaves.",
  imageUrl: "/images/teas/dragon-well.jpg",
  flavorProfile: ["Chestnut", "Vegetal", "Sweet"],
  rating: 4.8,
  harvestYear: 2024,
  aroma: ["Дым", "влажный камень", "пепел", "орхидея", "сладкие фрукты"],
  taste: [
    "Плотный",
    "маслянистый",
    "с нотами жженого сахара",
    "сухофруктов",
    "земли",
  ],

  brewingMethods: {
    gongfu: {
      id: "gongfu",
      name: "Gongfu Cha",
      waterTemperature: 80,
      teaAmount: "3-5g",
      waterAmount: "100ml",
      instructions: [
        "Preheat gaiwan and cups",
        "Add 3-5g tea leaves to gaiwan",
        "Rinse leaves with hot water (5 seconds) and discard",
        "First infusion: 85°C water for 15 seconds",
        "Increase steeping time by 5-10 seconds for each subsequent infusion",
      ],
      steepTimes: [
        { steep: 1, time: "15s" },
        { steep: 2, time: "20s" },
        { steep: 3, time: "30s" },
        { steep: 4, time: "40s" },
        { steep: 5, time: "50s" },
      ],
      notes: "Can yield 5-8 infusions. Use spring water for best results.",
    },
    western: {
      id: "western",
      name: "Western Style",
      waterTemperature: 85,
      teaAmount: "2-3g",
      waterAmount: "250ml",
      instructions: [
        "Heat water to 85°C (185°F)",
        "Add 2-3g tea leaves to teapot or infuser",
        "Pour hot water over leaves",
        "Steep for 2-3 minutes",
        "Strain and serve",
      ],
      steepTimes: [{ steep: 1, time: "2-3m" }],
      notes: "Best for single serving. Can resteep once with longer time.",
    },
    grandpa: {
      id: "grandpa",
      name: "Grandpa Style",
      waterTemperature: 90,
      teaAmount: "1-2g",
      waterAmount: "300ml",
      instructions: [
        "Add tea leaves directly to glass or mug",
        "Pour hot water (90°C)",
        "Drink when leaves settle at bottom",
        "Refill with hot water as you drink",
      ],
      steepTimes: [],
      notes: "Casual brewing method. Leaves can be consumed.",
    },
    coldBrew: {
      id: "cold-brew",
      name: "Cold Brew",
      waterTemperature: 20,
      teaAmount: "5g",
      waterAmount: "500ml",
      instructions: [
        "Add 5g tea leaves to pitcher",
        "Pour room temperature or cold water",
        "Refrigerate for 6-8 hours",
        "Strain and serve over ice",
      ],
      steepTimes: [{ steep: 1, time: "6-8h" }],
      notes: "Creates sweeter, less astringent brew. Store in refrigerator.",
    },
  },
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TeaPage({ params }: PageProps) {
  const { slug } = await params;

  // In real app: fetch tea data by slug
  if (slug !== mockTeaData.slug) {
    notFound();
  }

  const tea = mockTeaData;
  const brewingMethods = Object.values(tea.brewingMethods);

  return (
    <div className="">
      <main>
        <div className="mb-1">
          <TeaTypeLink />
        </div>

        <h1 className="text-[50px] mb-[45px]">{tea.name}</h1>
        <TeaDescription
          className="mb-[40px]"
          aroma={tea.aroma}
          taste={tea.taste}
        />

        <h2 className="text-[37px] mb-[33px]">Как заваривать проливами</h2>

        <div className="flex gap-[14px]">
          <BrewInfo
            temperature={tea.brewingMethods.gongfu.waterTemperature}
            ratio={5}
          />
          <SteepsTable
            steeps={tea.brewingMethods.gongfu.steepTimes.map((v) =>
              parseInt(v.time.slice(0, -1))
            )}
          />
        </div>

        <RowAdvertisement />
      </main>
    </div>
  );
}
