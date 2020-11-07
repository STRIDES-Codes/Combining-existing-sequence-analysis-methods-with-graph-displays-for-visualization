# Combining existing sequence analysis methods with graph displays to visualize sequence similarity networks and identify clusters of related sequences

## What is the problem?
Phylogenetic trees are often used to show relationships between genomic sequences, and identify patterns in metadata associated with the sequences. However, phylogenies assume that sequences are inherited in 1 direction - from ancestor to child. Biological phenomena such as horizontal gene transfer, indels, recombination/reassortment can often confuse the interpretation of phylogenies. Network graphs may be a better way of representing complex evolutionary histories, but it can be difficult to identify patterns and build hypotheses just from looking at the related clusters, so we want to solve the problem by adding vizualization layers for metadata and sequence attributes.


## How does our tool solve the problem?
*(include image of comparison tree:network:network with metadata)*

## How does it work?


## How to use
#### Files to prepare ahead of running
+ FASTA sequence files
+ GFF3 annotation files
+ source modifiers table *(GenBank submission style?)*


#### Considerations
+ Review your sequence data. Sequences with many N's or many gaps may make results less reliable. 
+ Review you associated data. Different types of data are more or less important to different research communities. For example, if a virus species is exclusively found in humans, a sequence submitter may not have seen the need to explicitly state that host = human. But if you are doing an analysis at the family level where the viruses infect a variety of hosts, you would want host defined for each.





# Results from CSHL Codeathon 2020

## Filtering the raw data
Start
There are a total of 39,340 SARS-CoV-2 sequences as of Nov 7 2020
+ Geo_location: 35,605 have this descriptor (91% have this descriptor)
+ USA 17,930 (46%) (note - only sequences from the US and that have a state will have this field)
+ Host 35,657 (91%)
+ Isolation_source 8,250 (21%)
+ Collection_date 35,689 (91%)
+ Seq is longer than 29,500 nucleotides long  37,265  (95%)
+ From an earlier analysis of a random subset of sequences, about 25% have an annotated gap (usually dozens+ nucleotides missing)

After running through filtering script, how many are left?






