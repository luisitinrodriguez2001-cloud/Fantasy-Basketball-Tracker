self.onmessage = e => {
  const { players = [] } = e.data || {};
  // simple worker echoing back player names
  postMessage(players.map(p => p.name));
};
