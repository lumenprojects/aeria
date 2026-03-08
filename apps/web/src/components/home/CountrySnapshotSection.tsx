import * as React from "react";
import { Flag } from "@/components/entities";
import { AspectRatio, Typography } from "@/components/ui";

type CountryFlagData = {
  id: string;
  slug: string;
  title_ru: string;
  flag_colors: string[];
};

type CountrySnapshot = {
  id: string;
  imageSrc: string;
  imageAlt: string;
  captions: [string, string, string];
  country: CountryFlagData;
};

const snapshotRatio = 3 / 4;

const staticDescription = "Aeria - не карта а след. Здесь мир собирается из голосов писем и тихих сцен.";

const snapshots: CountrySnapshot[] = [
  {
    id: "avzonia",
    imageSrc: "/assets/media/countries/avzonia-meadow.svg",
    imageAlt: "Тихая улица Авзонии",
    captions: ["Авзония", "Рошелье-ле-Ван", "квартал Руа-да-Круа"],
    country: {
      id: "country-avzonia",
      slug: "avzonia",
      title_ru: "Авзония",
      flag_colors: ["#b73a3a", "#f2eadf", "#2b567a"]
    }
  },
  {
    id: "virdan",
    imageSrc: "/assets/media/countries/virdan-delta.svg",
    imageAlt: "Каналы Вирдана",
    captions: ["Вирдан", "дельта Ревуа", "порт Вальмон"],
    country: {
      id: "country-virdan",
      slug: "virdan",
      title_ru: "Вирдан",
      flag_colors: ["#4f7aa5", "#f4f6fa", "#1f2f4f"]
    }
  },
  {
    id: "lumendor",
    imageSrc: "/assets/media/countries/lumendor-vista.svg",
    imageAlt: "Площадь Люмендора",
    captions: ["Люмендор", "Плас-де-Леон", "терраса Аурель"],
    country: {
      id: "country-lumendor",
      slug: "lumendor",
      title_ru: "Люмендор",
      flag_colors: ["#d72638", "#f5f1ea", "#1d5fa7"]
    }
  }
];

function pickRandomSnapshot() {
  const index = Math.floor(Math.random() * snapshots.length);
  return snapshots[index];
}

export function CountrySnapshotSection() {
  const [snapshot] = React.useState<CountrySnapshot>(pickRandomSnapshot);

  return (
    <section className="home-country-snapshot" data-testid="home-country-snapshot">
      <div className="home-country-snapshot-media-block">
        <AspectRatio ratio={snapshotRatio} className="home-country-snapshot-aspect">
          <div className="home-country-snapshot-media">
            <img
              src={snapshot.imageSrc}
              alt={snapshot.imageAlt}
              loading="eager"
              className="home-country-snapshot-image"
            />
            <Flag country={snapshot.country} size="sm" className="home-country-snapshot-flag" />
          </div>
        </AspectRatio>
        <div className="home-country-snapshot-captions" aria-label="Подписи к изображению">
          {snapshot.captions.map((caption) => (
            <Typography key={caption} variant="ui" className="home-country-snapshot-caption">
              {caption}
            </Typography>
          ))}
        </div>
      </div>

      <Typography variant="body" className="home-country-snapshot-description">
        {staticDescription}
      </Typography>
    </section>
  );
}
