"use client";

import * as React from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Github,
  Linkedin,
  Twitter,
  Loader2,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Activity,
  Handshake,
  LifeBuoy,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FadeIn, StaggerGroup, StaggerItem } from "@/components/shared/motion";
import { sleep } from "@/lib/utils";

const TEAM_SIZES = ["1–10", "11–50", "51–200", "201–1,000", "1,000+"] as const;
const TOPICS = [
  "Sales & pricing",
  "Product support",
  "Partnerships",
  "Media & press",
  "Something else",
] as const;

const contactSchema = z.object({
  name: z.string().min(2, "Please enter your full name."),
  workEmail: z.string().min(1, "Work email is required.").email("Enter a valid email address."),
  company: z.string().min(2, "Please enter your company name."),
  teamSize: z.enum(TEAM_SIZES, { required_error: "Select a team size." }),
  topic: z.enum(TOPICS, { required_error: "Select a topic." }),
  message: z.string().min(10, "Tell us a little more — at least 10 characters."),
});

type ContactValues = z.infer<typeof contactSchema>;

interface ReasonCard {
  icon: LucideIcon;
  title: string;
  description: string;
  contact: string;
}

const REASONS: ReasonCard[] = [
  {
    icon: TrendingUp,
    title: "Sales",
    description: "Scoping a rollout or need a tailored enterprise quote.",
    contact: "sales@chainroute.ai",
  },
  {
    icon: LifeBuoy,
    title: "Support",
    description: "Existing customer with a question or an incident.",
    contact: "support@chainroute.ai",
  },
  {
    icon: Handshake,
    title: "Partnerships",
    description: "Carriers, integrators and technology alliances.",
    contact: "partners@chainroute.ai",
  },
];

interface InfoItem {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}

const INFO: InfoItem[] = [
  {
    icon: Mail,
    label: "Email us",
    value: "hello@chainroute.ai",
    href: "mailto:hello@chainroute.ai",
  },
  {
    icon: Phone,
    label: "Call us",
    value: "+1 (415) 555-0142",
    href: "tel:+14155550142",
  },
  {
    icon: MapPin,
    label: "Headquarters",
    value: "228 Brannan Street, Suite 400, San Francisco, CA 94107",
  },
];

const SOCIALS: { icon: LucideIcon; label: string; href: string }[] = [
  { icon: Twitter, label: "Twitter", href: "https://twitter.com" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
  { icon: Github, label: "GitHub", href: "https://github.com" },
];

const TRUST: { icon: LucideIcon; label: string; detail: string }[] = [
  { icon: ShieldCheck, label: "SOC 2 Type II", detail: "Independently audited" },
  { icon: Lock, label: "GDPR ready", detail: "EU data residency" },
  { icon: Activity, label: "99.99% uptime", detail: "Backed by SLA" },
];

export default function ContactPage() {
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting, isSubmitSuccessful },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      workEmail: "",
      company: "",
      message: "",
    },
  });

  async function onSubmit(values: ContactValues) {
    await sleep(1100);
    toast.success("Thanks — we'll be in touch", {
      description: `Your ${values.topic.toLowerCase()} enquiry is on its way to our team.`,
    });
  }

  return (
    <div className="bg-mesh pb-24 pt-32">
      <section className="mx-auto max-w-6xl px-6">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <Badge variant="accent" className="mb-4">
            <Mail className="h-3.5 w-3.5" />
            We'd love to hear from you
          </Badge>
          <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Let's move your freight <span className="text-gradient">forward</span>
          </h1>
          <p className="mt-5 text-pretty text-lg text-muted-foreground">
            Whether you're evaluating ChainRoute or already shipping with us, our team is ready to
            help. Tell us what you need and we'll route you to the right people.
          </p>
        </FadeIn>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* Left column — contact info */}
          <div className="space-y-6">
            <FadeIn>
              <Card className="p-7">
                <h2 className="text-lg font-bold tracking-tight">Contact details</h2>
                <ul className="mt-5 space-y-4">
                  {INFO.map((item) => {
                    const Icon = item.icon;
                    const body = (
                      <div className="flex items-start gap-3.5">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary shadow-clay-inset">
                          <Icon className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {item.label}
                          </p>
                          <p className="mt-0.5 text-sm font-medium text-foreground">
                            {item.value}
                          </p>
                        </div>
                      </div>
                    );
                    return (
                      <li key={item.label}>
                        {item.href ? (
                          <a
                            href={item.href}
                            className="block rounded-xl transition-colors hover:text-primary"
                          >
                            {body}
                          </a>
                        ) : (
                          body
                        )}
                      </li>
                    );
                  })}
                </ul>

                <Separator className="my-6" />

                <div className="flex items-start gap-3.5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/12 text-accent shadow-clay-inset">
                    <Clock className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Office hours
                    </p>
                    <p className="mt-0.5 text-sm font-medium">Mon–Fri · 8am–6pm PT</p>
                    <p className="text-sm text-muted-foreground">
                      Enterprise support runs 24/7 via your dedicated channel.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2.5">
                  {SOCIALS.map((social) => {
                    const Icon = social.icon;
                    return (
                      <a
                        key={social.label}
                        href={social.href}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={social.label}
                        className="grid h-10 w-10 place-items-center rounded-xl bg-muted/60 text-muted-foreground shadow-clay-sm transition-colors hover:text-primary"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    );
                  })}
                </div>
              </Card>
            </FadeIn>

            <StaggerGroup className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {REASONS.map((reason) => {
                const Icon = reason.icon;
                return (
                  <StaggerItem key={reason.title}>
                    <Card className="clay-interactive h-full p-5">
                      <div className="flex items-center gap-3">
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary/15 text-secondary shadow-clay-inset">
                          <Icon className="h-4 w-4" />
                        </span>
                        <h3 className="font-semibold tracking-tight">{reason.title}</h3>
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">{reason.description}</p>
                      <a
                        href={`mailto:${reason.contact}`}
                        className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                      >
                        {reason.contact}
                      </a>
                    </Card>
                  </StaggerItem>
                );
              })}
            </StaggerGroup>
          </div>

          {/* Right column — form */}
          <FadeIn delay={0.1}>
            <Card className="p-7 sm:p-9">
              {isSubmitSuccessful ? (
                <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                  <span className="grid h-16 w-16 place-items-center rounded-2xl bg-success/15 text-success shadow-clay">
                    <CheckCircle2 className="h-8 w-8" />
                  </span>
                  <h2 className="mt-6 text-2xl font-bold tracking-tight">
                    Thanks — we'll be in touch
                  </h2>
                  <p className="mt-3 max-w-sm text-pretty text-muted-foreground">
                    Your message is on its way to our team. Expect a reply within one business day,
                    usually much sooner.
                  </p>
                  <Button
                    variant="clay"
                    className="mt-8"
                    onClick={() => reset()}
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold tracking-tight">Send us a message</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    Fill in the form and the right team will get back to you shortly.
                  </p>

                  <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="mt-7 space-y-5"
                    noValidate
                  >
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="name">Full name</Label>
                        <Input
                          id="name"
                          autoComplete="name"
                          placeholder="Jordan Rivera"
                          aria-invalid={!!errors.name}
                          {...register("name")}
                        />
                        {errors.name && (
                          <p className="text-xs font-medium text-destructive">
                            {errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="workEmail">Work email</Label>
                        <Input
                          id="workEmail"
                          type="email"
                          autoComplete="email"
                          placeholder="you@company.com"
                          aria-invalid={!!errors.workEmail}
                          {...register("workEmail")}
                        />
                        {errors.workEmail && (
                          <p className="text-xs font-medium text-destructive">
                            {errors.workEmail.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        autoComplete="organization"
                        placeholder="Meridian Freight Co."
                        aria-invalid={!!errors.company}
                        {...register("company")}
                      />
                      {errors.company && (
                        <p className="text-xs font-medium text-destructive">
                          {errors.company.message}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="teamSize">Team size</Label>
                        <Controller
                          control={control}
                          name="teamSize"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger id="teamSize" aria-invalid={!!errors.teamSize}>
                                <SelectValue placeholder="Select team size" />
                              </SelectTrigger>
                              <SelectContent>
                                {TEAM_SIZES.map((size) => (
                                  <SelectItem key={size} value={size}>
                                    {size} people
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.teamSize && (
                          <p className="text-xs font-medium text-destructive">
                            {errors.teamSize.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="topic">Topic</Label>
                        <Controller
                          control={control}
                          name="topic"
                          render={({ field }) => (
                            <Select value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger id="topic" aria-invalid={!!errors.topic}>
                                <SelectValue placeholder="What's this about?" />
                              </SelectTrigger>
                              <SelectContent>
                                {TOPICS.map((topic) => (
                                  <SelectItem key={topic} value={topic}>
                                    {topic}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.topic && (
                          <p className="text-xs font-medium text-destructive">
                            {errors.topic.message}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        rows={5}
                        placeholder="Tell us about your network, volumes and what you're hoping to solve…"
                        aria-invalid={!!errors.message}
                        {...register("message")}
                      />
                      {errors.message && (
                        <p className="text-xs font-medium text-destructive">
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      variant="gradient"
                      size="lg"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending…
                        </>
                      ) : (
                        <>
                          Send message
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">
                      By submitting you agree to our processing of your data to respond to your
                      enquiry.
                    </p>
                  </form>
                </>
              )}
            </Card>
          </FadeIn>
        </div>

        {/* Trust strip */}
        <FadeIn delay={0.1} className="mt-16">
          <Card variant="glass" className="p-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {TRUST.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3.5">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-success/12 text-success shadow-clay-inset">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-semibold tracking-tight">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </FadeIn>

        {/* FAQ link */}
        <FadeIn delay={0.15} className="mt-8">
          <Card variant="flat" className="flex flex-col items-center justify-between gap-3 p-5 text-center sm:flex-row sm:text-left">
            <p className="text-sm text-muted-foreground">
              Have a quick question? You might find the answer on our pricing FAQ.
            </p>
            <Button asChild variant="ghost" size="sm">
              <Link href="/pricing">
                Read the FAQ
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </Card>
        </FadeIn>
      </section>
    </div>
  );
}
