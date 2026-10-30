import { app } from './src/proxyApp.ts';

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`GB STUDY Proxy server is running on port ${PORT}`);
});
