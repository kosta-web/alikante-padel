import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryCards from "@/components/CategoryCards";
import Community from "@/components/Community";
import Journal from "@/components/Journal";

export default function Page() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <CategoryCards />
        <Community />
        <Journal />
      </main>
    </>
  );
}
