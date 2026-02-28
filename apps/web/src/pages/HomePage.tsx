import { Typography } from "@/components/ui/typography";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <Typography variant="h1">Aeria</Typography>
      <Typography variant="lead">
        Хранилище эпизодов, персонажей и атласа проекта. Это рабочий фундамент для чтения и исследований.
      </Typography>
      <Typography>
        Используй навбар для входа в разделы и глобальный поиск (Ctrl/Cmd + K) для быстрых переходов.
      </Typography>
    </div>
  );
}
