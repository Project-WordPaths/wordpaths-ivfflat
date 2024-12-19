import json 
import matplotlib.pyplot as plt
import numpy as np
import scipy
from scipy.stats import kstest, norm, normaltest

print("Loading index.") 
data = json.load(open("./data/index.json", "r"))

cluster_sizes = np.array([len(x) for x in data["clusters"]])

print("Index Statistics") 

print("--------------------------------------")

print(
    "No. of Clusters   :", 
    len(data["centroids"])
)


print("Percentiles") 
print("\t1 - ", np.percentile(cluster_sizes, 1))
print("\t5 - ", np.percentile(cluster_sizes, 5))
print("\t10 - ", np.percentile(cluster_sizes, 10))
print("\t20 - ", np.percentile(cluster_sizes, 20))
print("\t25 - ", np.percentile(cluster_sizes, 25))
print("\t50 - ", np.percentile(cluster_sizes, 50))
print("\t75 - ", np.percentile(cluster_sizes, 75))
print("\t90 - ", np.percentile(cluster_sizes, 90))
print("\t95 - ", np.percentile(cluster_sizes, 95))
print("\t99 - ", np.percentile(cluster_sizes, 99))

print("Max. (Cluster Size) :", 
    max(len(x) for x in data["clusters"])
)

print(
    "Min. (Cluster Size) :", 
    min(len(x) for x in data["clusters"])
)

print(
    "Ave. (Cluster Size) :", 
    sum(len(x) for x in data["clusters"]) / len(data["centroids"])
)

print(
    "Std. Dev. (Cluster Sizes):", 
    np.std(cluster_sizes)
)

stat, p = kstest(cluster_sizes, 'norm', args=(cluster_sizes.mean(), cluster_sizes.std()))
print(f"Normality (KS): {'looks normal' if p > 0.05 else 'looks non-normal'}")

result = normaltest(cluster_sizes)
print(f"Normality (DP): {'looks normal' if p > 0.05 else 'looks non-normal'}")


print("Enter anything to show histogram.") 
input()
plt.hist(cluster_sizes, bins=20)
plt.show()
