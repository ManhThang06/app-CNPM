import Providers from "./app/providers";
import AppRouter from "./routes/router";

export default function App() {
  return (
    <Providers>
      <AppRouter />
    </Providers>
  );
}
