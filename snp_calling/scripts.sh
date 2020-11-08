# Download Reference



wget https://ftp.ncbi.nlm.nih.gov/genomes/all/GCF/009/858/895/GCF_009858895.2_ASM985889v3/${REFERENCE_FASTA}.gz .
gunzip ${REFERENCE_FASTA}.gz


# Call Variants
for fasta_file in ${ANALYSIS_DIR}/*.fasta; do
  ./call_variants.sh $fasta_file $REFERENCE_FASTA
done

cat samples.txt | parallel ./call_variants.sh
for x in *.vcf; do bgzip $x; tabix $x.gz; done