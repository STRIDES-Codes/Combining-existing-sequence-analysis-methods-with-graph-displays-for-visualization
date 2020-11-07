import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

setuptools.setup(
    name="colorcluster",
    version="0.0.1",
    author="STRIDES/CSHL Codeathon team 10",
    description="Visualizing sequence similarity networks to identify clusters of related sequences",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/STRIDES-Codes/Combining-existing-sequence-analysis-methods-with-graph-displays-for-visualization",
    packages=setuptools.find_packages(),
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
)
