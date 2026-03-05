import { useState } from "react";
import { Link } from "react-router-dom";
import { EntityAvatar, Flag } from "@/components/entities";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  AspectRatio,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
  Button,
  ButtonGroup,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  Checkbox,
  Combobox,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Input,
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarTrigger,
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
  Pagination,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Progress,
  ScrollArea,
  Separator,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Typography
} from "@/components/ui";

const spacingTokens = [
  { key: "XS", token: "--space-xs", note: "микро-связи" },
  { key: "SM", token: "--space-sm", note: "связанные элементы" },
  { key: "MD", token: "--space-md", note: "типовой блок" },
  { key: "LG", token: "--space-lg", note: "независимые блоки" },
  { key: "XL", token: "--space-xl", note: "крупный разрыв секций" }
] as const;

const characterAvatarSrc =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#f8f0de" />
        <stop offset="100%" stop-color="#e8d9b8" />
      </linearGradient>
    </defs>
    <rect width="320" height="320" fill="url(#bg)" />
    <circle cx="160" cy="120" r="54" fill="#fff5e4" />
    <rect x="84" y="190" width="152" height="96" rx="48" fill="#fff5e4" />
    <circle cx="142" cy="114" r="5" fill="#3a3128" />
    <circle cx="178" cy="114" r="5" fill="#3a3128" />
    <path d="M132 144c9 10 47 10 56 0" stroke="#3a3128" stroke-width="4" fill="none" stroke-linecap="round" />
  </svg>
`);

const locationAvatarSrc =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#98c6ef" />
        <stop offset="100%" stop-color="#d3ebff" />
      </linearGradient>
    </defs>
    <rect width="320" height="320" fill="url(#sky)" />
    <path d="M0 224L72 162L132 210L196 144L264 190L320 152V320H0Z" fill="#567a4f" />
    <path d="M0 250L82 198L146 248L204 184L320 234V320H0Z" fill="#7fa569" />
  </svg>
`);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="showcase-section">
      <Typography variant="h4" as="h2">
        {title}
      </Typography>
      <div className="showcase-stack-sm">{children}</div>
    </section>
  );
}

export default function HomePage() {
  const [buttonGroupValue, setButtonGroupValue] = useState("one");
  const [comboValue, setComboValue] = useState("paper");
  const [page, setPage] = useState(2);

  return (
    <div className="showcase-feed">
      <div className="showcase-intro">
        <Typography variant="h2" as="h1">
          Компоненты Aeria
        </Typography>
        <Typography variant="muted">
          Временная лента компонентов. Здесь проверяем и фиксируем визуальные решения на токенах `--space-*`.
        </Typography>
      </div>

      <Section title="Spacing Tokens (XS / SM / MD / LG / XL)">
        <Typography variant="ui" className="tone-secondary">
          Визуальный ориентир desktop: около 10 / 20 / 40 / 80 / 160. Значения адаптивные и управляются только
          токенами.
        </Typography>
        <div className="spacing-scale-list">
          {spacingTokens.map((item) => (
            <article key={item.token} className="spacing-scale-item">
              <div className="spacing-scale-meta">
                <Typography variant="ui">
                  {item.key} <span className="tone-secondary">({item.token})</span>
                </Typography>
                <Typography variant="ui" className="tone-secondary">
                  {item.note}
                </Typography>
              </div>
              <div className="spacing-scale-bar" style={{ width: `var(${item.token})` }} />
              <div className="spacing-scale-preview" style={{ gap: `var(${item.token})` }}>
                <span className="spacing-scale-chip">A</span>
                <span className="spacing-scale-chip">B</span>
                <span className="spacing-scale-chip">C</span>
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <div className="showcase-stack-xs">
          <Typography variant="h1" as="p">
            Заголовок h1
          </Typography>
          <Typography variant="h2" as="p">
            Заголовок h2
          </Typography>
          <Typography variant="h3" as="p">
            Заголовок h3
          </Typography>
          <Typography variant="body">Основной текст body.</Typography>
          <Typography variant="lead">Lead-текст для акцентного абзаца.</Typography>
          <Typography variant="muted">Muted-текст для вторичного контента.</Typography>
          <Typography variant="ui">UI-текст для интерфейсных элементов.</Typography>
        </div>
      </Section>

      <Section title="Button / ButtonGroup / Badge">
        <div className="showcase-row-sm">
          <Button>Primary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="subtle">Subtle</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button asChild>
            <Link to="/episodes">Link Button</Link>
          </Button>
        </div>
        <ButtonGroup
          value={buttonGroupValue}
          onValueChange={setButtonGroupValue}
          options={[
            { label: "Один", value: "one" },
            { label: "Два", value: "two" },
            { label: "Три", value: "three" }
          ]}
        />
        <div className="showcase-row-xs">
          <Badge>Default</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="accent">Accent</Badge>
        </div>
      </Section>

      <Section title="Input / Checkbox / Combobox">
        <div className="showcase-stack-sm max-w-md">
          <Input placeholder="Введите текст..." />
          <label className="showcase-row-xs role-ui">
            <Checkbox defaultChecked />
            Чекбокс примера
          </label>
          <Combobox
            value={comboValue}
            onChange={setComboValue}
            options={[
              { label: "Paper", value: "paper" },
              { label: "Stone", value: "stone" },
              { label: "Coral", value: "coral" },
              { label: "Amoled", value: "amoled" }
            ]}
          />
        </div>
      </Section>

      <Section title="Avatar / EntityAvatar / Flag">
        <div className="showcase-row-sm">
          <Avatar size="xs">
            <AvatarImage src={characterAvatarSrc} alt="Avatar xs" />
            <AvatarFallback>XS</AvatarFallback>
          </Avatar>
          <Avatar size="sm">
            <AvatarImage src={characterAvatarSrc} alt="Avatar sm" />
            <AvatarFallback>SM</AvatarFallback>
          </Avatar>
          <Avatar size="md">
            <AvatarImage src={characterAvatarSrc} alt="Avatar md" />
            <AvatarFallback>MD</AvatarFallback>
          </Avatar>
          <Avatar size="lg">
            <AvatarImage src={characterAvatarSrc} alt="Avatar lg" />
            <AvatarFallback>LG</AvatarFallback>
          </Avatar>
        </div>
        <div className="showcase-row-sm">
          <EntityAvatar
            entityType="character"
            entitySlug="character-001"
            imageSrc={characterAvatarSrc}
            label="Пример персонажа"
            size="md"
          />
          <EntityAvatar
            entityType="location"
            entitySlug="capital-example"
            imageSrc={locationAvatarSrc}
            label="Столичный округ"
            size="md"
          />
          <Flag
            size="md"
            country={{
              id: "00000000-0000-0000-0000-000000000001",
              slug: "ru-example",
              title_ru: "Русская держава",
              flag_colors: ["#ffffff", "#0057b7", "#d52b1e"]
            }}
          />
        </div>
      </Section>

      <Section title="Breadcrumb / NavigationMenu / Menubar">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Главная</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/episodes">Эпизоды</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <NavigationMenu>
          <NavigationMenuList className="showcase-row-sm">
            <NavigationMenuItem>
              <NavigationMenuTrigger>Разделы</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="showcase-stack-xs">
                  <a href="/episodes">Эпизоды</a>
                  <a href="/characters">Персонажи</a>
                  <a href="/atlas">Атлас</a>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>Настройки</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Paper</MenubarItem>
              <MenubarItem>Stone</MenubarItem>
              <MenubarItem>Coral</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
      </Section>

      <Section title="Accordion / Popover / Tooltip">
        <Accordion type="single" collapsible className="max-w-xl">
          <AccordionItem value="item-1">
            <AccordionTrigger>Что это за страница?</AccordionTrigger>
            <AccordionContent>
              Временная витрина компонентов, чтобы последовательно адаптировать их под стиль Aeria.
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="showcase-row-sm">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Открыть Popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <Typography variant="ui">Контент поповера для проверки формы и отступов.</Typography>
            </PopoverContent>
          </Popover>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>Подсказка для иконок и действий</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </Section>

      <Section title="Carousel / AspectRatio / ScrollArea">
        <Carousel className="showcase-carousel max-w-3xl" opts={{ align: "start", loop: false }}>
          <CarouselContent>
            <CarouselItem className="basis-[80%]">
              <div className="showcase-card-body">Слайд 1</div>
            </CarouselItem>
            <CarouselItem className="basis-[80%]">
              <div className="showcase-card-body">Слайд 2</div>
            </CarouselItem>
            <CarouselItem className="basis-[80%]">
              <div className="showcase-card-body">Слайд 3</div>
            </CarouselItem>
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        <div className="max-w-sm">
          <AspectRatio ratio={16 / 9}>
            <div className="showcase-card-body flex h-full w-full items-center justify-center role-ui">16:9</div>
          </AspectRatio>
        </div>

        <ScrollArea className="h-32 max-w-xl showcase-panel">
          <div className="showcase-stack-xs">
            {Array.from({ length: 10 }).map((_, index) => (
              <Typography key={index} variant="body">
                Строка #{index + 1}
              </Typography>
            ))}
          </div>
        </ScrollArea>
      </Section>

      <Section title="Progress / Pagination / Separator / Skeleton">
        <div className="showcase-stack-sm max-w-md">
          <Progress value={68} />
          <Pagination page={page} totalPages={7} onPageChange={setPage} />
          <Separator />
          <div className="showcase-row-sm">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-40" />
          </div>
        </div>
      </Section>

      <Section title="Command">
        <div className="max-w-md showcase-panel">
          <Command>
            <CommandInput placeholder="Поиск по командам..." />
            <CommandList>
              <CommandEmpty>Нет результатов</CommandEmpty>
              <CommandGroup heading="Переходы">
                <CommandItem>Главная</CommandItem>
                <CommandItem>Эпизоды</CommandItem>
                <CommandItem>Персонажи</CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
      </Section>
    </div>
  );
}
