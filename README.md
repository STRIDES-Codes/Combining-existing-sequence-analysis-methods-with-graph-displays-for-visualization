# Combining existing sequence analysis methods with graph displays to visualize sequence similarity networks and identify clusters of related sequences

## What is the problem?
Phylogenetic trees are often used to show relationships between genomic sequences, and identify patterns in metadata associated with the sequences. However, phylogenies assume that sequences are inherited in 1 direction - from ancestor to child. Biological phenomena such as horizontal gene transfer, indels, recombination/reassortment can often confuse the interpretation of phylogenies. Network graphs may be a better way of representing complex evolutionary histories, but it can be difficult to identify patterns and build hypotheses just from looking at the related clusters, so we want to solve the problem by adding vizualization layers for metadata and sequence attributes.


## How does our tool solve the problem?
*(include image of comparison tree:network:network with metadata)*

## How does it work?
Nucleotide sequences and associated metadata are used as the input for Colr_Clustr. 

#### Graph visualization
After filtering out sequences which may be problematic in the analyses, a BLASTn all-against-all comparison is used to build a distance matrix. The distances are used as edge weights in a graph visualization. 

The distance matrix is also used to calculate clusters of sequences. With the SARS-CoV-2 data, we calculated a histogram of the distances to determine appropriate cluster cutoffs.

#### Metadata correlations
Two attributes are calculated as part of the pipeline: variants compared to the SARS-CoV-2 RefSeq (NC_045512.2), and the Pangolin lineages. Along with the downloaded metadata, which includes the collection location for the sample, the variants and lineages are compared to the sequence clusters to identify statistically-relevant correlations. 

![image](https://github.com/STRIDES-Codes/Combining-existing-sequence-analysis-methods-with-graph-displays-for-visualization/blob/main/Colr_Clustr_diagram1.jpg)


## How to use
#### Files to prepare ahead of running
+ FASTA sequence files
+ source modifiers table *(GenBank submission style?)*
+ Pangolin lineages

#### Requirements
+ flask
+ networkx
+ matplotlib



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

After running through filtering script, 28,325 sequences are left.

## Pangolin note
One of the steps is done using samtools, which has a limit to the number of characters allowed in sequence titles. If you download your sequence FASTAs from GenBank, they will probably be over this limit. We used this to trim titles (will not work if your sequence is all on 1 line)
`cut -c -80 file`




