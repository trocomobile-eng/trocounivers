import DesktopFeedPage from "./feed/DesktopFeedPage";
import MobileFeedPage from "./feed/MobileFeedPage";

export default function FeedPage() {
  return (
    <>
      <div className="hidden lg:block">
        <DesktopFeedPage />
      </div>

      <div className="block lg:hidden">
        <MobileFeedPage />
      </div>
    </>
  );
}
