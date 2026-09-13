import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Community from "@/components/Community";
import Articles from "@/components/Articles";

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Community />
        <Articles />
      </main>
    </>
  );
}
