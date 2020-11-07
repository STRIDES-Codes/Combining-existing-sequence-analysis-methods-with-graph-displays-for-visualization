# CCombining existing sequence analysis methods with graph displays to visualize sequence similarity networks and identify clusters of related sequences

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
