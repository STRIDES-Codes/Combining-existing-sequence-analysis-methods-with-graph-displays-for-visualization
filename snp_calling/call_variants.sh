FASTA_FILE=$1
REFERENCE_FASTA=$2

ANALYSIS_DIR=~/genbank/nucleotide/sequence/
OUT_DIR=/home/ubuntu/VCFs
TEMP_DIR=/home/ubuntu/data/tmp
REFERENCE_FASTA=GCF_009858895.2_ASM985889v3_genomic.fna

mkdir -p ${TEMP_DIR}
accession=`basename ${FASTA_FILE%.*}`
echo "Process $FASTA_FILE"

minimap2 -ax asm5 GCF_009858895.2_ASM985889v3_genomic.fna $FASTA_FILE > ${TEMP_DIR}/${accession}.sam
samtools view -Sb ${TEMP_DIR}/${accession}.sam > ${TEMP_DIR}/${accession}.bam
samtools sort -o ${TEMP_DIR}/${accession}.sorted.bam ${TEMP_DIR}/${accession}.bam
samtools index ${TEMP_DIR}/${accession}.sorted.bam

bcftools mpileup --threads 32 --max-idepth 8000 -f ${REFERENCE_FASTA} ${TEMP_DIR}/${accession}.sorted.bam --gvcf 5 --annotate FORMAT/DP 2>/dev/null \
| bcftools call --multiallelic-caller --variants-only --output-type z - 2> /dev/null \
|  zcat > ${OUT_DIR}/${accession}.vcf

bcftools mpileup --threads 32 --max-idepth 8000 -f ${REFERENCE_FASTA} ${TEMP_DIR}/${accession}.sorted.bam --gvcf 5 --annotate FORMAT/DP 2>/dev/null \
| bcftools call --multiallelic-caller --output-type z --gvcf 5 2> /dev/null \
|  zcat > ${OUT_DIR}/${accession}.gVCF;


