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

const snapshotRatio = 2 / 3;

const snapshots: CountrySnapshot[] = [
  {
    id: "lumendor",
    imageSrc: "/assets/media/countries/lumendor-vista.svg",
    imageAlt: "Площадь Люмендора",
    captions: ["Люмендор", "Lumendor", "Эверсоул"],
    country: {
      id: "country-lumendor",
      slug: "lumendor",
      title_ru: "Люмендор",
      flag_colors: ["#C1272D", "#111111", "#FFFFFF"]
    }
  },
  {
    id: "ausonia",
    imageSrc: "/assets/media/countries/avzonia-meadow.svg",
    imageAlt: "Тихая улица Авзонии",
    captions: ["Авзония", "Ausonia", "долины виноградников"],
    country: {
      id: "country-ausonia",
      slug: "ausonia",
      title_ru: "Авзония",
      flag_colors: ["#CD212A", "#FFFFFF", "#0055A4"]
    }
  },
  {
    id: "marijja",
    imageSrc: "/assets/media/countries/virdan-delta.svg",
    imageAlt: "Солнечная Мериджа",
    captions: ["Мериджа", "Marijja", "шумные рынки"],
    country: {
      id: "country-marijja",
      slug: "marijja",
      title_ru: "Мериджа",
      flag_colors: ["#FFBF36", "#C1272D", "#FFBF36"]
    }
  },
  {
    id: "rosmuir",
    imageSrc: "/assets/media/countries/selune-coast.svg",
    imageAlt: "Берег Росмюра",
    captions: ["Росмюр", "Rosmuir", "холодное побережье"],
    country: {
      id: "country-rosmuir",
      slug: "rosmuir",
      title_ru: "Росмюр",
      flag_colors: ["#FFFFFF", "#0055A4", "#111111"]
    }
  },
  {
    id: "vardfell",
    imageSrc: "/assets/media/countries/norvale-citadel.svg",
    imageAlt: "Крепость Вардфелля",
    captions: ["Вардфелль", "Vardfell", "каменные гавани"],
    country: {
      id: "country-vardfell",
      slug: "vardfell",
      title_ru: "Вардфелль",
      flag_colors: ["#507AA4", "#FFFFFF", "#203050"]
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
            <Flag country={snapshot.country} size="md" className="home-country-snapshot-flag" />
          </div>
        </AspectRatio>
        <div className="home-country-snapshot-captions" aria-label="Подписи к изображению">
          {snapshot.captions.map((caption) => (
            <Typography key={caption} variant="ui">
              {caption}
            </Typography>
          ))}
        </div>
      </div>

      <Typography variant="body" fontRole="heading" className="home-country-snapshot-description">
        <em>Aeria</em> — не карта а след
        <br />
        Здесь мир собирается из голосов писем и тихих сцен.
      </Typography>
    </section>
  );
}
