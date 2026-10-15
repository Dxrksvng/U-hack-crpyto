# Datasets (local, gitignored under data/)

Checked 2026-10-15. All files live on Je's Mac only; data/ is in .gitignore.

| File | Size | Shape | Label |
|---|---|---|---|
| data/transaction_dataset.csv (Ethereum Fraud, Kaggle vagifa) | 2.9 MB | 9,841 x 51 | FLAG: 0=7,662, 1=2,179 (22% fraud) |
| data/elliptic_bitcoin_dataset/elliptic_txs_features.csv | 690 MB | 203,769 x 167, no header | col0=txId, col1=timestep 1..49 |
| data/elliptic_bitcoin_dataset/elliptic_txs_classes.csv | 3.3 MB | 203,769 x 2 (txId, class) | 1=illicit 4,545, 2=licit 42,019, unknown 157,205 |
| data/elliptic_bitcoin_dataset/elliptic_txs_edgelist.csv | 4.5 MB | 234,355 x 2 (txId1, txId2) | graph edges |
| data/bitcoin_heist/BitcoinHeistData.csv (UCI 526) | 236 MB | 2,916,697 x 10 | label: white 98.6%, 28 ransomware families |
| data/export-transaction-list-1792044732655.csv | 13 KB | 50 x 12 | Etherscan export, no label |

Gotchas
- Ethereum: drop `Unnamed: 0` and `Index`; many column names have a leading space; `ERC20 uniq sent addr.1` is a duplicate-named column.
- Elliptic: in classes, "1" means illicit and "2" licit (not 0/1). Use temporal split by timestep (e.g. train <=34, test >34), not random split.
- Bitcoin Heist: extreme imbalance; `income` is in satoshi.
