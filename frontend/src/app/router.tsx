import { createBrowserRouter } from "react-router-dom";
import { RequireAuth } from "@app/guards/RequireAuth";
import { RequireGuest } from "@app/guards/RequireGuest";
import { RequireRole } from "@app/guards/RequireRole";
import { MainLayout } from "@app/layouts/MainLayout";
import { OrganizerPage } from "@pages/OrganizerPage";
import { BookingCheckoutPage } from "@pages/BookingCheckoutPage";
import { EventDetailsPage } from "@pages/EventDetailsPage";
import { EventsCatalogPage } from "@pages/EventsCatalogPage";
import { ForbiddenPage } from "@pages/ForbiddenPage";
import { GroupJoinPage } from "@pages/GroupJoinPage";
import { GroupSessionPage } from "@pages/GroupSessionPage";
import { GroupsPage } from "@pages/GroupsPage";
import { LoginPage } from "@pages/LoginPage";
import { MyTicketsPage } from "@pages/MyTicketsPage";
import { NotFoundPage } from "@pages/NotFoundPage";
import { PaymentResultPage } from "@pages/PaymentResultPage";
import { ProfileBookingsPage } from "@pages/ProfileBookingsPage";
import { ProfilePage } from "@pages/ProfilePage";
import { RegisterPage } from "@pages/RegisterPage";
import { TicketDetailsPage } from "@pages/TicketDetailsPage";
import { TicketValidationPage } from "@pages/TicketValidationPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <EventsCatalogPage /> },
      { path: "events/:eventId", element: <EventDetailsPage /> },
      {
        path: "auth",
        element: <RequireGuest />,
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> }
        ]
      },
      {
        element: <RequireAuth />,
        children: [
          { path: "bookings/:bookingId", element: <BookingCheckoutPage /> },
          { path: "bookings/:bookingId/result", element: <PaymentResultPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "profile/bookings", element: <ProfileBookingsPage /> },
          { path: "profile/tickets", element: <MyTicketsPage /> },
          { path: "tickets/:ticketId", element: <TicketDetailsPage /> },
          { path: "groups/my", element: <GroupsPage /> },
          { path: "groups/join/:inviteLink", element: <GroupJoinPage /> },
          { path: "groups/:sessionId", element: <GroupSessionPage /> },
          {
            element: <RequireRole allowedRoles={["organizer", "admin"]} />,
            children: [{ path: "organizer", element: <OrganizerPage /> }]
          },
          {
            element: <RequireRole allowedRoles={["admin", "organizer"]} />,
            children: [{ path: "tickets/validate", element: <TicketValidationPage /> }]
          }
        ]
      },
      { path: "forbidden", element: <ForbiddenPage /> },
      { path: "*", element: <NotFoundPage /> }
    ]
  }
]);
