# Download Reference

REFERENCE_FASTA=GCF_009858895.2_ASM985889v3_genomic.fna

wget https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/009/858/895/GCF_009858895.2_ASM985889v3/${REFERENCE_FASTA}.gz .
gunzip ${REFERENCE_FASTA}.gz

ANALYSIS_DIR=~/genbank/nucleotide/sequence/
OUT_DIR=/home/ubuntu/VCFs
TEMP_DIR=/home/ubuntu/data/tmp

# Call Variants
for fasta_file in ${ANALYSIS_DIR}/*.fasta; do
  mkdir -p ${TEMP_DIR}
  accession=`basename ${fasta_file%.*}`
  echo "Process $fasta_file"

  minimap2 -ax asm5 GCF_009858895.2_ASM985889v3_genomic.fna $fasta_file > ${TEMP_DIR}/${accession}.sam
  samtools view -Sb ${TEMP_DIR}/${accession}.sam > ${TEMP_DIR}/${accession}.bam
  samtools sort -o ${TEMP_DIR}/${accession}.sorted.bam ${TEMP_DIR}/${accession}.bam
  samtools index ${TEMP_DIR}/${accession}.sorted.bam
  bcftools mpileup --threads 32 --max-idepth 8000 -f ${REFERENCE_FASTA} ${TEMP_DIR}/${accession}.sorted.bam > ${OUT_DIR}/${accession}.vcf
done


[M::main::0.047*0.18] loaded/built the index for 1 target sequence(s)
[M::mm_mapopt_update::0.047*0.18] mid_occ = 100
[M::mm_idx_stat] kmer size: 19; skip: 19; is_hpc: 0; #seq: 1
[M::mm_idx_stat::0.048*0.18] distinct minimizers: 3006 (100.00% are singletons); average occurrences: 1.000; average spacing: 9.948
[M::main] Version: 2.17-r941
[M::main] CMD: minimap2 -ax asm5 GCF_009858895.2_ASM985889v3_genomic.fna /home/ubuntu/genbank/nucleotide/sequence//7CTT_T.fasta
[M::main] Real time: 0.072 sec; CPU: 0.010 sec; Peak RSS: 0.012 GB



gzip: stdin: unexpected end of file
Process /home/ubuntu/genbank/nucleotide/sequence//CADINI000000000.1.fasta



[M::main::0.047*0.17] loaded/built the index for 1 target sequence(s)
[M::mm_mapopt_update::0.047*0.17] mid_occ = 100
[M::mm_idx_stat] kmer size: 19; skip: 19; is_hpc: 0; #seq: 1
[M::mm_idx_stat::0.048*0.18] distinct minimizers: 3006 (100.00% are singletons); average occurrences: 1.000; average spacing: 9.948
[M::worker_pipeline::0.090*0.27] mapped 1 sequences
[M::main] Version: 2.17-r941
[M::main] CMD: minimap2 -ax asm5 GCF_009858895.2_ASM985889v3_genomic.fna /home/ubuntu/genbank/nucleotide/sequence//LC571025.1.fasta
[M::main] Real time: 0.091 sec; CPU: 0.026 sec; Peak RSS: 0.012 GB
[mpileup] 1 samples in 1 input files

gzip: stdin: unexpected end of file
Process /home/ubuntu/genbank/nucleotide/sequence//LC571026.1.fasta
[M::mm_idx_gen::0.023*0.18] collected minimizers