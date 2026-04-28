import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./store";
import { PreferencesProvider } from "./preferences";

interface ProvidersProps {
  children: React.ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <PreferencesProvider>
        <BrowserRouter>{children}</BrowserRouter>
      </PreferencesProvider>
    </Provider>
  );
}
